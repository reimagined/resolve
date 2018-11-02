import 'source-map-support/register'
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

const lambdaWorker = async (assemblies, resolveBase, event, context) => {
  context.callbackWaitsForEmptyEventLoop = false
  let executorResult = null

  const resolve = Object.create(resolveBase)
  await initResolve(assemblies, resolve)

  // API gateway event
  if (event.headers != null && event.httpMethod != null) {
    const getCustomParameters = async () => ({ resolve })
    const executor = wrapApiHandler(mainHandler, getCustomParameters)

    executorResult = await executor(event, context)
  }
  // DynamoDB trigger event
  else if (event.Records != null) {
    const events = event.Records.map(record =>
      Converter.unmarshall(record.dynamodb.NewImage)
    )
    const applicationPromises = []
    for (const executor of resolve.executeQuery.getExecutors().values()) {
      applicationPromises.push(executor.updateByEvents(events))
    }

    await Promise.all(applicationPromises)
    executorResult = true
  }

  await disposeResolve(resolve)

  if (executorResult == null) {
    throw new Error(`Lambda cannot be invoked with event: ${event}`)
  }

  return executorResult
}

const cloudEntry = async ({ assemblies, constants, domain, redux, routes }) => {
  try {
    const resolve = { ...constants, ...domain, redux, routes }
    resolve.aggregateActions = assemblies.aggregateActions

    return lambdaWorker.bind(null, assemblies, resolve)
  } catch (error) {
    println(error)
  }
}

export default cloudEntry
