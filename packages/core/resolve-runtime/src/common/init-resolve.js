import createEventStore from 'resolve-es'
import createCommandExecutor from 'resolve-command'
import createQueryExecutor from 'resolve-query'
import crypto from 'crypto'

const initResolve = async resolve => {
  const performanceTracer = resolve.performanceTracer

  const {
    storageAdapter: createStorageAdapter,
    snapshotAdapter: createSnapshotAdapter,
    readModelConnectors: readModelConnectorsCreators
  } = resolve.assemblies

  const storageAdapter = createStorageAdapter()
  const eventStore = createEventStore({
    storage: storageAdapter,
    publishEvent: resolve.publishEvent
  })

  resolve.readModels = resolve.readModels.slice(0)
  for (let index = 0; index < resolve.readModels.length; index++) {
    resolve.readModels[index] = Object.create(resolve.readModels[index], {
      executeCommand: { get: () => resolve.executeCommand, enumerable: true },
      executeQuery: { get: () => resolve.executeQuery, enumerable: true },
      eventProperties: { get: () => resolve.eventProperties, enumerable: true }
    })
  }

  const { aggregates, readModels, viewModels } = resolve
  const snapshotAdapter = createSnapshotAdapter()

  const readModelConnectors = {}
  for (const name of Object.keys(readModelConnectorsCreators)) {
    readModelConnectors[name] = options =>
      readModelConnectorsCreators[name]({
        ...options,
        performanceTracer
      })
  }

  const executeCommand = createCommandExecutor({
    eventStore,
    aggregates,
    snapshotAdapter,
    performanceTracer
  })

  const executeQuery = createQueryExecutor({
    eventStore,
    readModelConnectors,
    snapshotAdapter,
    doUpdateRequest: resolve.doUpdateRequest,
    readModels,
    viewModels,
    performanceTracer
  })

  Object.assign(resolve, {
    executeCommand,
    executeQuery,
    eventStore
  })

  Object.defineProperties(resolve, {
    readModelConnectors: { value: readModelConnectors },
    snapshotAdapter: { value: snapshotAdapter },
    storageAdapter: { value: storageAdapter }
  })

  process.env.RESOLVE_LOCAL_TRACE_ID = crypto
    .randomBytes(Math.ceil(32 / 2))
    .toString('hex')
    .slice(0, 32)
}

export default initResolve
