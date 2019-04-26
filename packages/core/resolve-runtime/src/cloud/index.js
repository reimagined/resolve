import 'source-map-support/register'
import IotData from 'aws-sdk/clients/iotdata'
import v4 from 'aws-signature-v4'
import STS from 'aws-sdk/clients/sts'
import StepFunctions from 'aws-sdk/clients/stepfunctions'
import Lambda from 'aws-sdk/clients/lambda'
import wrapApiHandler from 'resolve-api-handler-awslambda'

import mainHandler from '../common/handlers/main-handler'
import handleDeployServiceEvent from '../common/handlers/deploy-service-event-handler'
import handleEventBusEvent from '../common/handlers/event-bus-event-handler'
import handleSchedulerEvent from '../common/handlers/scheduler-event-handler'
import initResolve from '../common/init-resolve'
import disposeResolve from '../common/dispose-resolve'
import prepareDomain from '../common/prepare-domain'
import initBroker from './init-broker'

const invokeUpdateLambda = async ({ stepFunctions }, readModel) => {
  resolveLog(
    'debug',
    `requesting step function execution to update read-model/saga [${readModel}]`
  )
  await stepFunctions
    .startExecution({
      stateMachineArn: process.env.RESOLVE_EVENT_BUS_STEP_FUNCTION_ARN,
      input: JSON.stringify({
        'detail-type': 'LISTEN_EVENT_BUS',
        listenerId: readModel.name,
        invariantHash: readModel.invariantHash,
        inactiveTimeout: 1000 * 60 * 60,
        eventTypes: Object.keys(readModel.projection)
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
  resolveLog('debug', 'executing application lambda')
  resolveLog('trace', 'incoming event', lambdaEvent)

  lambdaContext.callbackWaitsForEmptyEventLoop = false
  let executorResult = null

  const resolve = Object.create(resolveBase)
  try {
    resolveLog('debug', 'initializing reSolve framework')
    await initResolve(resolve)
    resolveLog('debug', 'reSolve framework initialized')

    if (lambdaEvent.resolveSource === 'DeployService') {
      resolveLog('debug', 'identified event source: deployment service')
      executorResult = await handleDeployServiceEvent(lambdaEvent, resolve)
    } else if (lambdaEvent.resolveSource === 'EventBus') {
      resolveLog('debug', 'identified event source: invoked by a step function')
      executorResult = await handleEventBusEvent(lambdaEvent, resolve)
    } else if (lambdaEvent.resolveSource === 'Scheduler') {
      resolveLog('debug', 'identified event source: cloud scheduler')
      executorResult = await handleSchedulerEvent(lambdaEvent, resolve)
    } else if (lambdaEvent.headers != null && lambdaEvent.httpMethod != null) {
      resolveLog('debug', 'identified event source: API gateway')
      resolveLog('trace', lambdaEvent.httpMethod, lambdaEvent.headers)

      const getCustomParameters = async () => ({ resolve })
      const executor = wrapApiHandler(mainHandler, getCustomParameters)

      executorResult = await executor(lambdaEvent, lambdaContext)
    }
  } catch (error) {
    resolveLog('error', 'top-level event handler execution error!')
    resolveLog('error', error.stack)
  } finally {
    await disposeResolve(resolve)
    resolveLog('debug', 'reSolve framework was disposed')
  }

  if (executorResult == null) {
    throw new Error(`abnormal lambda execution on event ${lambdaEvent}`)
  }

  return executorResult
}

const index = async ({ assemblies, constants, domain, redux, routes }) => {
  resolveLog('debug', `starting lambda 'cold start'`)
  try {
    resolveLog('debug', 'configuring reSolve framework')
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

    resolveLog('debug', 'preparing domain')
    await prepareDomain(resolve)

    resolveLog('debug', 'patching reSolve framework')
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

          resolveLog(
            'info',
            'Lambda pushed event into MQTT successfully',
            eventDescriptor
          )
        } catch (error) {
          resolveLog(
            'warn',
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

    resolveLog('debug', `lambda 'cold start' succeeded`)

    return lambdaWorker.bind(null, assemblies, resolve)
  } catch (error) {
    resolveLog('error', `lambda 'cold start' failure`, error)
  }
}

export default index
