const createAdapter = (
  {
    prepare,
    wrapMethod,
    wrapEventFilter,
    wrapSaveEvent,
    wrapDispose,
    validateEventFilter,
    importStream,
    exportStream
  },
  {
    connect,
    init,
    loadEvents,
    getLatestEvent,
    saveEvent,
    drop,
    dispose,
    saveEventOnly,
    saveSequenceOnly,
    paginateEvents,
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
    saveEventOnly: wrapMethod(pool, saveEventOnly),
    saveSequenceOnly: wrapMethod(pool, saveSequenceOnly),
    paginateEvents: wrapMethod(pool, paginateEvents),
    // eslint-disable-next-line no-new-func
    waitConnectAndInit: wrapMethod(pool, Function()),
    initOnly: wrapMethod(pool, init),
    wrapMethod,
    isFrozen: wrapMethod(pool, isFrozen)
  })

  prepare(pool, connect, init, adapterSpecificArguments)

  const adapter = {
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
    isFrozen: wrapMethod(pool, isFrozen),
    freeze: wrapMethod(pool, freeze),
    unfreeze: wrapMethod(pool, unfreeze)
  }

  Object.assign(pool, adapter)

  return Object.freeze(adapter)
}

export default createAdapter
