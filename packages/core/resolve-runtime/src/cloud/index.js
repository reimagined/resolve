import 'source-map-support/register'
import IotData from 'aws-sdk/clients/iotdata'
import uuid from 'uuid/v4'
import v4 from 'aws-signature-v4'
import STS from 'aws-sdk/clients/sts'
import StepFunctions from 'aws-sdk/clients/stepfunctions'
import Lambda from 'aws-sdk/clients/lambda'
import debugLevels from 'debug-levels'
import wrapApiHandler from 'resolve-api-handler-awslambda'

import mainHandler from '../common/handlers/main-handler'
import handleDeployServiceEvent from '../common/handlers/deploy-service-event-handler'
import handleEventBusEvent from '../common/handlers/event-bus-event-handler'
import handleSchedulerEvent from '../common/handlers/scheduler-event-handler'
import initResolve from '../common/init-resolve'
import disposeResolve from '../common/dispose-resolve'
import prepareDomain from '../common/prepare-domain'
import initBroker from './init-broker'

const log = debugLevels('resolve:resolve-runtime:cloud-entry')

const invokeUpdateLambda = async (
  { stepFunctions },
  { name: listenerId, invariantHash, projection }
) => {
  log.debug(
    `requesting step function execution to update read-model/saga "${listenerId}"`
  )
  await stepFunctions
    .startExecution({
      stateMachineArn: process.env.RESOLVE_EVENT_BUS_STEP_FUNCTION_ARN,
      name: `${listenerId}-${uuid()}`,
      input: JSON.stringify({
        'detail-type': 'LISTEN_EVENT_BUS',
        listenerId,
        invariantHash,
        inactiveTimeout: 1000 * 60 * 60,
        eventTypes: Object.keys(projection)
      })
    })
    .promise()
}

const getSubscribeAdapterOptions = async ({ sts }) => {
  const {
    RESOLVE_DEPLOYMENT_ID,
    RESOLVE_WS_ENDPOINT,
    RESOLVE_IOT_ROLE_ARN
  } = process.env

  const data = await sts
    .assumeRole({
      RoleArn: RESOLVE_IOT_ROLE_ARN,
      RoleSessionName: `role-session-${RESOLVE_DEPLOYMENT_ID}`,
      DurationSeconds: 3600
    })
    .promise()

  const url = v4.createPresignedURL(
    'GET',
    RESOLVE_WS_ENDPOINT,
    '/mqtt',
    'iotdevicegateway',
    '',
    {
      key: data.Credentials.AccessKeyId,
      secret: data.Credentials.SecretAccessKey,
      sessionToken: data.Credentials.SessionToken,
      protocol: 'wss'
    }
  )

  return {
    appId: RESOLVE_DEPLOYMENT_ID,
    url
  }
}

const lambdaWorker = async (
  assemblies,
  resolveBase,
  lambdaEvent,
  lambdaContext
) => {
  log.debug('executing application lambda')
  log.verbose('incoming event', lambdaEvent)

  lambdaContext.callbackWaitsForEmptyEventLoop = false
  let executorResult = null

  const resolve = Object.create(resolveBase)
  try {
    log.debug('initializing reSolve framework')
    await initResolve(resolve)
    log.debug('reSolve framework initialized')

    if (lambdaEvent.resolveSource === 'DeployService') {
      log.debug('identified event source: deployment service')
      executorResult = await handleDeployServiceEvent(lambdaEvent, resolve)
    } else if (lambdaEvent.resolveSource === 'EventBus') {
      log.debug('identified event source: invoked by a step function')
      executorResult = await handleEventBusEvent(lambdaEvent, resolve)
    } else if (lambdaEvent.resolveSource === 'Scheduler') {
      log.debug('identified event source: cloud scheduler')
      executorResult = await handleSchedulerEvent(lambdaEvent, resolve)
    } else if (lambdaEvent.headers != null && lambdaEvent.httpMethod != null) {
      log.debug('identified event source: API gateway')
      log.verbose(lambdaEvent.httpMethod, lambdaEvent.headers)

      const getCustomParameters = async () => ({ resolve })
      const executor = wrapApiHandler(mainHandler, getCustomParameters)

      executorResult = await executor(lambdaEvent, lambdaContext)
    }
  } catch (error) {
    log.error('top-level event handler execution error!')
    if (error instanceof Error) {
      log.error('error', error.message)
      log.error('error', error.stack)
    } else {
      log.error(JSON.stringify(error))
    }
  } finally {
    await disposeResolve(resolve)
    log.debug('reSolve framework was disposed')
  }

  if (executorResult == null) {
    throw new Error(
      `abnormal lambda execution on event ${JSON.stringify(lambdaEvent)}`
    )
  }

  log.verbose(`executorResult: ${JSON.stringify(executorResult)}`)
  return executorResult
}

const index = async ({ assemblies, constants, domain, redux, routes }) => {
  log.debug(`starting lambda 'cold start'`)
  try {
    log.debug('configuring reSolve framework')
    const resolve = {
      aggregateActions: assemblies.aggregateActions,
      seedClientEnvs: assemblies.seedClientEnvs,
      sts: new STS(),
      mqtt: new IotData({
        endpoint: process.env.RESOLVE_WS_ENDPOINT
      }),
      lambda: new Lambda(),
      stepFunctions: new StepFunctions(),
      assemblies,
      ...constants,
      ...domain,
      redux,
      routes
    }

    log.debug('preparing domain')
    await prepareDomain(resolve)

    log.debug('patching reSolve framework')
    Object.defineProperties(resolve, {
      publishEvent: async event => {
        const eventDescriptor = {
          topic: `${process.env.RESOLVE_DEPLOYMENT_ID}/${event.type}/${
            event.aggregateId
          }`,
          payload: JSON.stringify(event),
          qos: 1
        }

        try {
          await resolve.mqtt.publish(eventDescriptor).promise()

          log.info(
            'Lambda pushed event into MQTT successfully',
            eventDescriptor
          )
        } catch (error) {
          log.warn(
            'Lambda can not publish event into MQTT',
            eventDescriptor,
            error
          )
        }
      },
      getSubscribeAdapterOptions: {
        value: getSubscribeAdapterOptions.bind(null, resolve)
      },
      doUpdateRequest: {
        value: async readModelName => {
          const readModel = resolve.readModels.find(
            ({ name }) => name === readModelName
          )
          await invokeUpdateLambda(resolve, readModel)
        }
      }
    })

    await initBroker(resolve)

    log.debug(`lambda 'cold start' succeeded`)

    return lambdaWorker.bind(null, assemblies, resolve)
  } catch (error) {
    log.error(`lambda 'cold start' failure`, error)
  }
}

export default index
