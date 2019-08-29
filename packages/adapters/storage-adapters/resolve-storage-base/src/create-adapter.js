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

  const wrappedFreeze = wrapMethod(pool, freeze)
  const wrappedUnfreeze = wrapMethod(pool, unfreeze)
  const wrappedIsFrozen =
    typeof isFrozen === 'function' ? wrapMethod(pool, isFrozen) : null

  Object.assign(pool, {
    isFrozen: wrappedIsFrozen,
    freeze: wrappedFreeze,
    unfreeze: wrappedUnfreeze,
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
    dispose: wrapDispose(pool, dispose),
    isFrozen: wrappedIsFrozen,
    freeze: wrappedFreeze,
    unfreeze: wrappedUnfreeze
  })
}

export default createAdapter
