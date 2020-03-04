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
    saveEventOnly,
    paginateEvents,
    isFrozen,
    freeze,
    unfreeze,
    shapeEvent,
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
    saveEventOnly: wrapMethod(pool, saveEventOnly),
    loadEventsByCursor: wrapMethod(pool, loadEventsByCursor),
    loadEventsByTimestamp: wrapMethod(pool, loadEventsByTimestamp),
    paginateEvents: wrapMethod(pool, paginateEvents),
    // eslint-disable-next-line no-new-func
    waitConnect: wrapMethod(pool, Function()),
    wrapMethod,
    isFrozen: wrapMethod(pool, isFrozen),
    connectPromise,
    connectPromiseResolve,
    shapeEvent
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
    getNextCursor: getNextCursor.bind(null)
  }

  Object.assign(pool, adapter)

  return Object.freeze(adapter)
}

export default createAdapter
