import getLog from './get-log'
import { AdapterPool } from './types'
import { LeveledDebugger } from 'resolve-debug-levels'

// eslint-disable-next-line no-new-func
const idempotentFunction = Function('obj', 'return obj') as <T>(t: T) => T

const coerceEmptyString = (obj: any, fallback?: string): string =>
  (obj != null && obj.constructor !== String) || obj == null
    ? fallback != null && fallback.constructor === String
      ? fallback
      : 'default'
    : obj

const createAdapter = (
  {
    wrapMethod,
    wrapEventFilter,
    wrapSaveEvent,
    wrapDispose,
    validateEventFilter,
    loadEvents,
    importStream,
    exportStream,
    incrementalImport,
    getNextCursor,
  }: any,
  {
    connect,
    loadEventsByCursor,
    loadEventsByTimestamp,
    getLatestEvent,
    saveEvent,
    init,
    drop,
    dispose,
    injectEvent,
    isFrozen,
    freeze,
    unfreeze,
    shapeEvent,
    loadSnapshot,
    saveSnapshot,
    dropSnapshot,
    beginIncrementalImport,
    commitIncrementalImport,
    rollbackIncrementalImport,
    pushIncrementalImport,
    getSecret,
    setSecret,
    deleteSecret,
    ...adapterSpecificArguments
  }: any,
  options: any
): any => {
  const log: LeveledDebugger & debug.Debugger = getLog(`createAdapter`)
  const config: any = { ...options }
  const originalPool: AdapterPool = {
    config,
    disposed: false,
    validateEventFilter,
  }

  let bucketSize = 100
  const { snapshotBucketSize } = config
  if (Number.isSafeInteger(snapshotBucketSize) && snapshotBucketSize > 0) {
    bucketSize = snapshotBucketSize
    log.debug(`snapshot bucket size explicitly set to ${bucketSize}`)
  } else {
    log.debug(`snapshot bucket size defaulted to ${bucketSize}`)
  }

  let connectPromiseResolve
  const connectPromise = new Promise((resolve) => {
    connectPromiseResolve = resolve.bind(null, null)
  }).then(connect.bind(null, originalPool, adapterSpecificArguments))

  const pool = Object.assign(originalPool, {
    injectEvent: wrapMethod(originalPool, injectEvent),
    loadEventsByCursor: wrapMethod(originalPool, loadEventsByCursor),
    loadEventsByTimestamp: wrapMethod(originalPool, loadEventsByTimestamp),
    deleteSecret: wrapMethod(originalPool, deleteSecret),
    getSecret: wrapMethod(originalPool, getSecret),
    setSecret: wrapMethod(originalPool, setSecret),
    waitConnect: wrapMethod(originalPool, idempotentFunction),
    wrapMethod,
    coerceEmptyString,
    isFrozen: wrapMethod(originalPool, isFrozen),
    connectPromise,
    connectPromiseResolve,
    shapeEvent,
    counters: new Map(),
    bucketSize,
  })

  const adapter: any = {
    loadEvents: wrapMethod(pool, wrapEventFilter(loadEvents)),
    import: importStream.bind(null, pool),
    export: exportStream.bind(null, pool),
    getLatestEvent: wrapMethod(pool, getLatestEvent),
    saveEvent: wrapMethod(pool, wrapSaveEvent(saveEvent)),
    init: wrapMethod(pool, init),
    drop: wrapMethod(pool, drop),
    dispose: wrapDispose(pool, dispose),
    isFrozen: wrapMethod(pool, isFrozen),
    freeze: wrapMethod(pool, freeze),
    unfreeze: wrapMethod(pool, unfreeze),
    getNextCursor: getNextCursor.bind(null),
    getSecretsManager: wrapMethod(
      pool,
      idempotentFunction.bind(null, {
        deleteSecret: pool.deleteSecret,
        getSecret: pool.getSecret,
        setSecret: pool.setSecret,
      })
    ),
    loadSnapshot: wrapMethod(pool, loadSnapshot),
    saveSnapshot: wrapMethod(pool, saveSnapshot),
    dropSnapshot: wrapMethod(pool, dropSnapshot),
    pushIncrementalImport: wrapMethod(pool, pushIncrementalImport),
    beginIncrementalImport: wrapMethod(pool, beginIncrementalImport),
    commitIncrementalImport: wrapMethod(pool, commitIncrementalImport),
    rollbackIncrementalImport: wrapMethod(pool, rollbackIncrementalImport),
    incrementalImport: wrapMethod(pool, incrementalImport),
  }

  Object.assign(pool, adapter)

  return Object.freeze(adapter)
}

export default createAdapter
