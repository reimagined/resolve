import 'source-map-support/register'
import IotData from 'aws-sdk/clients/iotdata'
import { Converter } from 'aws-sdk/clients/dynamodb'
import v4 from 'aws-signature-v4'
import STS from 'aws-sdk/clients/sts'

import wrapApiHandler from 'resolve-api-handler-awslambda'
import createCommandExecutor from 'resolve-command'
import createEventStore from 'resolve-es'
import createQueryExecutor from 'resolve-query'
import println from './utils/println'

import mainHandler from './handlers/main_handler'

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

  const executeCommand = createCommandExecutor({
    eventStore,
    aggregates,
    snapshotAdapter
  })

  const executeQuery = createQueryExecutor({
    eventStore,
    viewModels,
    readModels,
    readModelAdaptersCreators,
    snapshotAdapter
  })

  Object.assign(resolve, {
    executeCommand,
    executeQuery,
    eventStore
  })

  Object.defineProperties(resolve, {
    snapshotAdapter: { value: snapshotAdapter },
    storageAdapter: { value: storageAdapter }
  })
}

const disposeResolve = async resolve => {
  await resolve.executeQuery.dispose()
  await resolve.storageAdapter.dispose()
  await resolve.snapshotAdapter.dispose()
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
  lambdaContext.callbackWaitsForEmptyEventLoop = false
  let executorResult = null

  const resolve = Object.create(resolveBase)
  await initResolve(assemblies, resolve)

  // API gateway event
  if (lambdaEvent.headers != null && lambdaEvent.httpMethod != null) {
    const getCustomParameters = async () => ({ resolve })
    const executor = wrapApiHandler(mainHandler, getCustomParameters)

    executorResult = await executor(lambdaEvent, lambdaContext)
  }
  // DynamoDB trigger event
  // AWS DynamoDB streams guarantees that changesets from one table partition will
  // be delivered strictly into one lambda instance, i.e. following code works in
  // single-thread mode for one event storage - see https://amzn.to/2LkKXAV
  else if (lambdaEvent.Records != null) {
    const applicationPromises = []
    const events = lambdaEvent.Records.map(record =>
      Converter.unmarshall(record.dynamodb.NewImage)
    )
    // TODO. Refactoring MQTT publish event
    for (const event of events) {
      applicationPromises.push(
        resolve.mqtt
          .publish({
            topic: `${process.env.DEPLOYMENT_ID}/${event.type}/${
              event.aggregateId
            }`,
            payload: JSON.stringify(event),
            qos: 1
          })
          .promise()
          .catch(error => {
            // eslint-disable-next-line no-console
            console.warn(error)
          })
      )
    }

    for (const executor of resolve.executeQuery.getExecutors().values()) {
      applicationPromises.push(executor.updateByEvents(events))
    }

    await Promise.all(applicationPromises)
    executorResult = true
  }

  await disposeResolve(resolve)

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

    return lambdaWorker.bind(null, assemblies, resolve)
  } catch (error) {
    println(error)
  }
}

export default cloudEntry
