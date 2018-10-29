const createAdapter = (
  wrapInit,
  wrapMethod,
  wrapLoadEvents,
  wrapDispose,
  init,
  loadEvents,
  saveEvent,
  dispose,
  db,
  options
) => {
  const config = { ...options }
  const pool = { config, disposed: false }
  wrapInit(pool, init, db)

  return Object.freeze({
    loadEvents: wrapMethod(pool, wrapLoadEvents(loadEvents)),
    saveEvent: wrapMethod(pool, saveEvent),
    dispose: wrapMethod(pool, wrapDispose(dispose))
  })
}

export default createAdapter
