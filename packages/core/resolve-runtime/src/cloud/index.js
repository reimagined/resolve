import 'source-map-support/register'
import IotData from 'aws-sdk/clients/iotdata'
import v4 from 'aws-signature-v4'
import STS from 'aws-sdk/clients/sts'
import StepFunctions from 'aws-sdk/clients/stepfunctions'

import wrapApiHandler from 'resolve-api-handler-awslambda'

import mainHandler from '../common/handlers/main-handler'
import handleDeployServiceEvent from '../common/handlers/deploy-service-event-handler'
import handleEventBusEvent from '../common/handlers/event-bus-event-handler'
import initResolve from '../common/init-resolve'
import disposeResolve from '../common/dispose-resolve'
import prepareDomain from '../common/prepare-domain'

const stepFunctions = new StepFunctions()

const invokeUpdateLambda = async readModel => {
  await stepFunctions
    .startExecution({
      stateMachineArn: process.env.EVENT_BUS_STEP_FUNCTION_ARN,
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
  const { DEPLOYMENT_ID, IOT_ENDPOINT_HOST, IOT_ROLE_ARN } = process.env

  const data = await sts
    .assumeRole({
      RoleArn: IOT_ROLE_ARN,
      RoleSessionName: `role-session-${DEPLOYMENT_ID}`,
      DurationSeconds: 3600
    })
    .promise()

  const url = v4.createPresignedURL(
    'GET',
    IOT_ENDPOINT_HOST,
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
    appId: DEPLOYMENT_ID,
    url
  }
}

const lambdaWorker = async (
  assemblies,
  resolveBase,
  lambdaEvent,
  lambdaContext
) => {
  resolveLog('debug', 'Lambda handler has received event', lambdaEvent)

  lambdaContext.callbackWaitsForEmptyEventLoop = false
  let executorResult = null

  const resolve = Object.create(resolveBase)
  try {
    await initResolve(resolve)
    resolveLog('debug', 'Lambda handler has initialized resolve instance')

    // Resolve event invoked by deploy service
    if (lambdaEvent.resolveSource === 'DeployService') {
      resolveLog(
        'debug',
        'Lambda handler classified event as DeployService event',
        lambdaEvent
      )

      executorResult = await handleDeployServiceEvent(lambdaEvent, resolve)
    }
    // Resolve event invoked by event bus
    else if (lambdaEvent.resolveSource === 'EventBus') {
      resolveLog(
        'debug',
        'Lambda handler classified event as Event Bus event',
        lambdaEvent
      )

      executorResult = await handleEventBusEvent(lambdaEvent, resolve)
    }
    // API gateway event
    else if (lambdaEvent.headers != null && lambdaEvent.httpMethod != null) {
      resolveLog(
        'debug',
        'Lambda handler classified event as API gateway',
        lambdaEvent.httpMethod,
        lambdaEvent.headers
      )
      const getCustomParameters = async () => ({ resolve })
      const executor = wrapApiHandler(mainHandler, getCustomParameters)

      executorResult = await executor(lambdaEvent, lambdaContext)
    }
  } catch (e) {
    resolveLog('error', e.stack)
  } finally {
    await disposeResolve(resolve)
    resolveLog('debug', 'Lambda handler has disposed resolve instance')
  }

  if (executorResult == null) {
    throw new Error(`Lambda cannot be invoked with event: ${lambdaEvent}`)
  }

  return executorResult
}

const index = async ({ assemblies, constants, domain, redux, routes }) => {
  try {
    const resolve = {
      aggregateActions: assemblies.aggregateActions,
      seedClientEnvs: assemblies.seedClientEnvs,
      sts: new STS(),
      mqtt: new IotData({
        endpoint: process.env.IOT_ENDPOINT_HOST
      }),
      publishEvent: async () => {},
      assemblies,
      ...constants,
      ...domain,
      redux,
      routes
    }

    await prepareDomain(resolve)

    Object.defineProperties(resolve, {
      getSubscribeAdapterOptions: {
        value: getSubscribeAdapterOptions.bind(null, resolve)
      },
      doUpdateRequest: {
        value: async readModelName => {
          const readModel = resolve.readModels.find(
            ({ name }) => name === readModelName
          )
          await invokeUpdateLambda(readModel)
        }
      }
    })

    resolveLog('debug', 'Cloud entry point cold start success', resolve)

    return lambdaWorker.bind(null, assemblies, resolve)
  } catch (error) {
    resolveLog('error', 'Cloud entry point cold start failure', error)
  }
}

export default index
