const createAdapter = (
  { prepare, wrapMethod, wrapEventFilter, wrapDispose },
  {
    connect,
    init,
    loadEvents,
    getReadStream,
    getLatestEvent,
    saveEvent,
    drop,
    dispose
  },
  adapterSpecificArguments,
  options
) => {
  const config = { ...options }
  const pool = { config, disposed: false }

  prepare(pool, connect, init, adapterSpecificArguments)

  pool.waitConnectAndInit = wrapMethod(pool, Function())

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
    getReadStream: getReadStream.bind(null, pool),
    getLatestEvent: wrapMethod(pool, getLatestEvent),
    saveEvent: wrapMethod(pool, saveEvent),
    drop: wrapMethod(pool, drop),
    dispose: wrapDispose(pool, dispose)
  })
}

export default createAdapter
