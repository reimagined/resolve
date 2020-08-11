import createCommandExecutor from 'resolve-command'
import createQueryExecutor from 'resolve-query'
import createSagaExecutor from 'resolve-saga'
import crypto from 'crypto'

const DEFAULT_WORKER_LIFETIME = 4 * 60 * 1000

const initResolve = async resolve => {
  const performanceTracer = resolve.performanceTracer

  const {
    eventstoreAdapter: createEventstoreAdapter,
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
  const eventstoreAdapter = createEventstoreAdapter()

  const readModelConnectors = {}
  for (const name of Object.keys(readModelConnectorsCreators)) {
    readModelConnectors[name] = readModelConnectorsCreators[name]({
      performanceTracer,
      eventstoreAdapter
    })
  }

  const executeCommand = createCommandExecutor({
    publisher,
    aggregates,
    eventstoreAdapter,
    performanceTracer
  })

  const executeQuery = createQueryExecutor({
    publisher,
    eventstoreAdapter,
    readModelConnectors,
    readModels,
    viewModels,
    performanceTracer
  })

  const executeSaga = createSagaExecutor({
    executeCommand,
    executeQuery,
    publisher,
    eventstoreAdapter,
    readModelConnectors,
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
