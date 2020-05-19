import createCommandExecutor from 'resolve-command'
import createQueryExecutor from 'resolve-query'
import createSagaExecutor from 'resolve-saga'
import crypto from 'crypto'

const DEFAULT_WORKER_LIFETIME = 15 * 60 * 1000

const initResolve = async resolve => {
  const performanceTracer = resolve.performanceTracer

  const {
    eventstoreAdapter: createEventstoreAdapter,
    snapshotAdapter: createSnapshotAdapter,
    readModelConnectors: readModelConnectorsCreators
  } = resolve.assemblies

  const {
    aggregates,
    readModels,
    schedulers,
    sagas,
    viewModels,
    publisher,
    uploader
  } = resolve
  const snapshotAdapter = createSnapshotAdapter()
  const eventstoreAdapter = createEventstoreAdapter()

  const readModelConnectors = {}
  for (const name of Object.keys(readModelConnectorsCreators)) {
    readModelConnectors[name] = readModelConnectorsCreators[name]({
      performanceTracer
    })
  }

  const executeCommand = createCommandExecutor({
    publisher,
    aggregates,
    snapshotAdapter,
    performanceTracer,
    eventstoreAdapter
  })

  const executeQuery = createQueryExecutor({
    publisher,
    readModelConnectors,
    snapshotAdapter,
    readModels,
    viewModels,
    performanceTracer
  })

  const executeSaga = createSagaExecutor({
    executeCommand,
    executeQuery,
    publisher,
    readModelConnectors,
    snapshotAdapter,
    schedulers,
    sagas,
    performanceTracer,
    uploader
  })

  Object.assign(resolve, {
    executeCommand,
    executeQuery,
    executeSaga
  })

  Object.defineProperties(resolve, {
    readModelConnectors: { value: readModelConnectors },
    snapshotAdapter: { value: snapshotAdapter },
    eventstoreAdapter: { value: eventstoreAdapter }
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
