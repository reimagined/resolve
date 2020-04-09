import createEventStore from 'resolve-es'
import createCommandExecutor from 'resolve-command'
import createQueryExecutor from 'resolve-query'
import createSagaExecutor from 'resolve-saga'
import crypto from 'crypto'

const DEFAULT_WORKER_LIFETIME = 15 * 60 * 1000

const initResolve = async resolve => {
  const performanceTracer = resolve.performanceTracer

  const {
    storageAdapter: createStorageAdapter,
    snapshotAdapter: createSnapshotAdapter,
    readModelConnectors: readModelConnectorsCreators,
    encryptionAdapter: createEncryptionAdapter
  } = resolve.assemblies

  const storageAdapter = createStorageAdapter()
  const eventStore = createEventStore({
    storage: storageAdapter,
    publishEvent: resolve.publishEvent
  })

  const { aggregates, readModels, schedulers, sagas, viewModels } = resolve
  const snapshotAdapter = createSnapshotAdapter()

  const readModelConnectors = {}
  for (const name of Object.keys(readModelConnectorsCreators)) {
    readModelConnectors[name] = readModelConnectorsCreators[name]({
      performanceTracer
    })
  }

  const encryptionAdapter =
    typeof createEncryptionAdapter === 'function'
      ? createEncryptionAdapter()
      : null

  const executeCommand = createCommandExecutor({
    eventStore,
    aggregates,
    snapshotAdapter,
    performanceTracer,
    encryptionAdapter
  })

  const executeQuery = createQueryExecutor({
    eventStore,
    readModelConnectors,
    snapshotAdapter,
    readModels,
    viewModels,
    performanceTracer,
    encryptionAdapter
  })

  const executeSaga = createSagaExecutor({
    executeCommand,
    executeQuery,
    eventStore,
    readModelConnectors,
    snapshotAdapter,
    schedulers,
    sagas,
    performanceTracer,
    encryptionAdapter
  })

  Object.assign(resolve, {
    executeCommand,
    executeQuery,
    executeSaga,
    eventStore
  })

  Object.defineProperties(resolve, {
    readModelConnectors: { value: readModelConnectors },
    snapshotAdapter: { value: snapshotAdapter },
    storageAdapter: { value: storageAdapter },
    encryptionAdapter: { value: encryptionAdapter }
  })

  if (!resolve.hasOwnProperty('getRemainingTimeInMillis')) {
    const endTime = Date.now() + DEFAULT_WORKER_LIFETIME
    resolve.getRemainingTimeInMillis = () => endTime - Date.now()
  }

  process.env.RESOLVE_LOCAL_TRACE_ID = crypto
    .randomBytes(Math.ceil(32 / 2))
    .toString('hex')
    .slice(0, 32)
}

export default initResolve
