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

const invokeUpdateLambda = async ({ stepFunctions }, readModel) => {
  resolveLog('debug', `requesting step function execution to update read-model/saga [${readModel}]`)
  await stepFunctions
    .startExecution({
      stateMachineArn: process.env.EVENT_BUS_STEP_FUNCTION_ARN,
      input: JSON.stringify({
        'detail-type': 'LISTEN_EVENT_BUS',
        listenerId: name,
        invariantHash,
        inactiveTimeout: 1000 * 60 * 60,
        eventTypes: Object.keys(projection)
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
    }
    else if (lambdaEvent.resolveSource === 'EventBus') {
      resolveLog('debug', 'identified event source: invoked by a step function')
      executorResult = await handleEventBusEvent(lambdaEvent, resolve)
    }
    else if (lambdaEvent.resolveSource === 'Scheduler') {
      resolveLog('debug', 'identified event source: cloud scheduler')
      executorResult = await handleSchedulerEvent(lambdaEvent, resolve)
    }
    else if (lambdaEvent.headers != null && lambdaEvent.httpMethod != null) {
      resolveLog('debug', 'identified event source: API gateway')
      resolveLog('trace', lambdaEvent.httpMethod, lambdaEvent.headers)

      const getCustomParameters = async () => ({ resolve })
      const executor = wrapApiHandler(mainHandler, getCustomParameters)

      executorResult = await executor(lambdaEvent, lambdaContext)
    }
  } catch (e) {
    resolveLog('error', 'top-level event handler execution error!')
    resolveLog('error', e.stack)
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
        endpoint: process.env.IOT_ENDPOINT_HOST
      }),
      lambda: new Lambda(),
      stepFunctions: new StepFunctions(),
      publishEvent: async () => {},
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

    resolveLog('debug', `lambda 'cold start' succeeded`)

    return lambdaWorker.bind(null, assemblies, resolve)
  } catch (error) {
    resolveLog('error', `lambda 'cold start' failure`, error)
  }
}

export default index
