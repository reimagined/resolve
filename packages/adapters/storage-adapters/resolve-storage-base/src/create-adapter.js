const createAdapter = (
  { prepare, wrapMethod, wrapEventFilter, wrapDispose, validateEventFilter },
  {
    connect,
    init,
    loadEvents,
    getEventStream,
    getLatestEvent,
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
    loadEvents: wrapMethod(pool, wrapEventFilter(loadEvents)),
    getEventStream: getEventStream.bind(null, pool),
    getLatestEvent: wrapMethod(pool, getLatestEvent),
    saveEvent: wrapMethod(pool, saveEvent),
    drop: wrapMethod(pool, drop),
    dispose: wrapDispose(pool, dispose)
  })
}

export default createAdapter
