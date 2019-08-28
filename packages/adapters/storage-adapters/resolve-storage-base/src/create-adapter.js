const createAdapter = (
  { prepare, wrapMethod, wrapEventFilter, wrapDispose, validateEventFilter },
  {
    connect,
    init,
    loadEvents,
    import: importStream,
    export: exportStream,
    getLatestEvent,
    checkEventStoreActive,
    activateEventStore,
    deactivateEventStore,
    saveEvent,
    drop,
    dispose,
    ...adapterSpecificArguments
  },
  options
) => {
  const config = { ...options }
  const pool = { config, disposed: false, validateEventFilter }
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
    checkEventStoreActive: wrapMethod(pool, checkEventStoreActive),
    activateEventStore: wrapMethod(pool, activateEventStore),
    deactivateEventStore: wrapMethod(pool, deactivateEventStore),
    loadEvents: wrapMethod(pool, wrapEventFilter(loadEvents)),
    import: importStream.bind(null, pool),
    export: exportStream.bind(null, pool),
    getLatestEvent: wrapMethod(pool, getLatestEvent),
    saveEvent: wrapMethod(pool, saveEvent),
    drop: wrapMethod(pool, drop),
    dispose: wrapDispose(pool, dispose)
  })
}

export default createAdapter
