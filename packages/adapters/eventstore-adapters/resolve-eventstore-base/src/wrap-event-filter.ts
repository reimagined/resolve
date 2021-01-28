const wrapEventFilter = (loadEvents: any) => async (
  pool: any,
  filter: any
): Promise<any> => {
  pool.validateEventFilter(filter)
  if (filter.cursor != null) {
    try {
      if (filter.cursor !== pool.getNextCursor(filter.cursor, [])) {
        // eslint-disable-next-line no-throw-literal
        throw null
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
