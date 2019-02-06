const createAdapter = (
  prepare,
  wrapMethod,
  wrapEventFilter,
  wrapDispose,
  connect,
  init,
  loadEvents,
  getLatestEvent,
  saveEvent,
  dispose,
  adapterSpecificArguments,
  options
) => {
  const config = { ...options }
  const pool = { config, disposed: false }

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
      Function() // eslint-disable-line no-new-func
    ),
    loadEvents: wrapMethod(pool, wrapEventFilter(loadEvents)),
    getLatestEvent: wrapMethod(pool, getLatestEvent),
    saveEvent: wrapMethod(pool, saveEvent),
    dispose: wrapMethod(pool, wrapDispose(dispose))
  })
}

export default createAdapter
