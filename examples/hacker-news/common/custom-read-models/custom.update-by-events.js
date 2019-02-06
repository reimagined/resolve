const updateByEvents = async (pool, events) => {
  pool.events = (Array.isArray(pool.events) ? pool.events : []).concat(events)
}

export default updateByEvents
