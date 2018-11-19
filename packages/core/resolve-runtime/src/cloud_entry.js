import 'source-map-support/register'
import IotData from 'aws-sdk/clients/iotdata'
import { Converter } from 'aws-sdk/clients/dynamodb'

import wrapApiHandler from 'resolve-api-handler-awslambda'
import createCommandExecutor from 'resolve-command'
import createEventStore from 'resolve-es'
import createQueryExecutor from 'resolve-query'
import println from './utils/println'

import mainHandler from './handlers/main_handler'

const initResolve = async (
  {
    snapshotAdapter: createSnapshotAdapter,
    storageAdapter: createStorageAdapter
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

// TODO. Refactoring MQTT publish event
let mqtt
const getMqtt = () => {
  if (!mqtt) {
    mqtt = new IotData({
      endpoint: process.env.IOT_ENDPOINT_HOST
    })
  }
  return mqtt
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
        getMqtt()
          .publish({
            topic: `${process.env.DEPLOYMENT_ID}/${event.type}/${
              event.aggregateId
            }`,
            payload: JSON.stringify(event),
            qos: 1
          })
          .promise()
          .catch(error => {
            // eslint-disable-next-line
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
    const resolve = { ...constants, ...domain, redux, routes }
    resolve.aggregateActions = assemblies.aggregateActions
    resolve.seedClientEnvs = assemblies.seedClientEnvs

    return lambdaWorker.bind(null, assemblies, resolve)
  } catch (error) {
    println(error)
  }
}

export default cloudEntry
