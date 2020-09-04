const wrapEventFilter = (loadEvents) => async (pool, filter) => {
  pool.validateEventFilter(filter)
  if (filter.cursor != null) {
    try {
      if (filter.cursor !== pool.getNextCursor(filter.cursor, [])) {
        throw null // eslint-disable-line no-throw-literal
      }
    } catch (e) {
      throw new Error(
        `Event filter field "cursor" is malformed: ${JSON.stringify(
          filter.cursor
        )}`
      )
    }
  }

  return await loadEvents(pool, filter)
}

export default wrapEventFilter
