import 'source-map-support/register'
import IotData from 'aws-sdk/clients/iotdata'
import { Converter } from 'aws-sdk/clients/dynamodb'
import v4 from 'aws-signature-v4'
import STS from 'aws-sdk/clients/sts'
import Lambda from 'aws-sdk/clients/lambda'

import wrapApiHandler from 'resolve-api-handler-awslambda'
import createCommandExecutor from 'resolve-command'
import createEventStore from 'resolve-es'
import createQueryExecutor, { constants as queryConstants } from 'resolve-query'

import mainHandler from './handlers/main_handler'
import handleDeployServiceEvent from './handlers/deploy_service_event_handler'
import handleEventBusEvent from './handlers/event_bus_event_handler'

const lambda = new Lambda({ apiVersion: '2015-03-31' })

const invokeUpdateLambda = async readModel =>
  await lambda
    .invoke({
      FunctionName: process.env.EVENT_BUS_LAMBDA_ARN,
      InvocationType: 'Event',
      Payload: JSON.stringify({
        'detail-type': 'LISTEN_EVENT_BUS',
        deploymentId: process.env.DEPLOYMENT_ID,
        listenerId: readModel.name,
        invariantHash: readModel.invariantHash,
        lambdaArn: process.env.AWS_LAMBDA_FUNCTION_NAME,
        inactiveTimeout: 1000 * 60 * 60,
        eventTypes: Object.keys(readModel.projection)
      }),
      LogType: 'None'
    })
    .promise()

const initResolve = async (
  {
    snapshotAdapter: createSnapshotAdapter,
    storageAdapter: createStorageAdapter,
    readModelAdapters: readModelAdaptersCreators
  },
  resolve
) => {
  const storageAdapter = createStorageAdapter()
  const eventStore = createEventStore({ storage: storageAdapter })
  const { aggregates, readModels, viewModels } = resolve
  const snapshotAdapter = createSnapshotAdapter()

  const readModelAdapters = {}
  for (const { name, factory } of readModelAdaptersCreators) {
    readModelAdapters[name] = factory()
  }

  const executeCommand = createCommandExecutor({
    eventStore,
    aggregates,
    snapshotAdapter
  })

  const executeQuery = createQueryExecutor({
    doUpdateRequest: async (pool, readModelName) => {
      const readModel = readModels.find(({ name }) => name === readModelName)
      await invokeUpdateLambda(readModel)
    },
    eventStore,
    viewModels,
    readModels,
    readModelAdapters,
    snapshotAdapter
  })

  Object.assign(resolve, {
    executeCommand,
    executeQuery,
    eventStore
  })

  Object.defineProperties(resolve, {
    readModelAdapters: { value: readModelAdapters },
    snapshotAdapter: { value: snapshotAdapter },
    storageAdapter: { value: storageAdapter }
  })
}

const disposeResolve = async resolve => {
  await resolve.storageAdapter.dispose()

  await resolve.snapshotAdapter.dispose()

  for (const name of Object.keys(resolve.readModelAdapters)) {
    await resolve.readModelAdapters[name].dispose()
  }
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
    await initResolve(assemblies, resolve)
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
  } finally {
    await disposeResolve(resolve)
    resolveLog('debug', 'Lambda handler has disposed resolve instance')
  }

  if (executorResult == null) {
    throw new Error(`Lambda cannot be invoked with event: ${lambdaEvent}`)
  }

  return executorResult
}

const cloudEntry = async ({ assemblies, constants, domain, redux, routes }) => {
  try {
    const resolve = {
      aggregateActions: assemblies.aggregateActions,
      seedClientEnvs: assemblies.seedClientEnvs,
      sts: new STS(),
      mqtt: new IotData({
        endpoint: process.env.IOT_ENDPOINT_HOST
      }),
      ...constants,
      ...domain,
      redux,
      routes
    }

    resolve.getSubscribeAdapterOptions = getSubscribeAdapterOptions.bind(
      null,
      resolve
    )

    resolveLog('debug', 'Cloud entry point cold start success', resolve)

    return lambdaWorker.bind(null, assemblies, resolve)
  } catch (error) {
    resolveLog('error', 'Cloud entry point cold start failure', error)
  }
}

export default cloudEntry
