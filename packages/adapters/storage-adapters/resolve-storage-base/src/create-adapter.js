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
    loadEventsByTypes: wrapMethod(pool, wrapLoadEvents(loadEvents, 'type')),
    loadEventsByAggregateIds: wrapMethod(
      pool,
      wrapLoadEvents(loadEvents, 'aggregateId')
    ),
    saveEvent: wrapMethod(pool, saveEvent),
    dispose: wrapMethod(pool, wrapDispose(dispose))
  })
}

export default createAdapter
