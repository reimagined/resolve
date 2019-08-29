const createAdapter = (
  {
    prepare,
    wrapMethod,
    wrapEventFilter,
    wrapSaveEvent,
    wrapDispose,
    validateEventFilter
  },
  {
    connect,
    init,
    loadEvents,
    getLatestEvent,
    saveEvent,
    drop,
    dispose,
    import: importStream,
    export: exportStream,
    isFrozen,
    freeze,
    unfreeze,
    ...adapterSpecificArguments
  },
  options
) => {
  const config = { ...options }
  const pool = { config, disposed: false, validateEventFilter }
  Object.assign(pool, {
    ...(typeof isFrozen === 'function'
      ? { isFrozen: wrapMethod(pool, isFrozen) }
      : {}),
    freeze: wrapMethod(pool, freeze),
    unfreeze: wrapMethod(pool, unfreeze),
    wrapMethod
  })

  // eslint-disable-next-line no-new-func
  pool.waitConnectAndInit = wrapMethod(pool, Function())

  prepare(pool, connect, init, adapterSpecificArguments)

  return Object.freeze({
    init: wrapMethod(
      Object.create(pool, {
        config: {
          writable: true,
          configurable: true,
          value: Object.create(config, {
            skipInit: { value: false }
          })
        }
      }),
      () => pool.initialPromiseResult
    ),
    loadEvents: wrapMethod(pool, wrapEventFilter(loadEvents)),
    import: importStream.bind(null, pool),
    export: exportStream.bind(null, pool),
    getLatestEvent: wrapMethod(pool, getLatestEvent),
    saveEvent: wrapMethod(pool, wrapSaveEvent(saveEvent)),
    drop: wrapMethod(pool, drop),
    dispose: wrapDispose(pool, dispose)
  })
}

export default createAdapter
