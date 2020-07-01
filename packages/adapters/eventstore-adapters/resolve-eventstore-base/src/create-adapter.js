import getSecretsManagerFallback from './get-secrets-manager-fallback'

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
    getNextCursor
  },
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
    getSecretsManager = getSecretsManagerFallback,
    ...adapterSpecificArguments
  },
  options
) => {
  const config = { ...options }
  const pool = { config, disposed: false, validateEventFilter }

  let connectPromiseResolve
  const connectPromise = new Promise(resolve => {
    connectPromiseResolve = resolve.bind(null, null)
  }).then(connect.bind(null, pool, adapterSpecificArguments))

  Object.assign(pool, {
    injectEvent: wrapMethod(pool, injectEvent),
    loadEventsByCursor: wrapMethod(pool, loadEventsByCursor),
    loadEventsByTimestamp: wrapMethod(pool, loadEventsByTimestamp),
    // eslint-disable-next-line no-new-func
    waitConnect: wrapMethod(pool, Function()),
    wrapMethod,
    isFrozen: wrapMethod(pool, isFrozen),
    connectPromise,
    connectPromiseResolve,
    shapeEvent,
    counters: new Map(),
    bucketSize:
      Number.isInteger(config.snapshotBucketSize) &&
      config.snapshotBucketSize > 0
        ? config.snapshotBucketSize
        : 100
  })

  const adapter = {
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
    getSecretsManager: wrapMethod(pool, getSecretsManager),
    loadSnapshot: wrapMethod(pool, loadSnapshot),
    saveSnapshot: wrapMethod(pool, saveSnapshot),
    dropSnapshot: wrapMethod(pool, dropSnapshot)
  }

  Object.assign(pool, adapter)

  return Object.freeze(adapter)
}

export default createAdapter
