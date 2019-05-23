import createQuery from './create-query'

const loadEvents = async (pool, filter, callback) => {
  const { database, escapeId, tableName } = pool
  const { maxEventsByTimeframe = Number.POSITIVE_INFINITY } = filter

  const batchSize = 1000

  const resultQueryCondition = createQuery(pool, filter)

  let initialTimestamp = null
  let countEvents = 0
  loop: for (let skipCount = 0; ; skipCount++) {
    const rows = await database.all(
      `SELECT * FROM ${escapeId(tableName)} ${resultQueryCondition}
      ORDER BY ${escapeId('timestamp')} ASC,
      ${escapeId('aggregateVersion')} ASC
      LIMIT ${+(skipCount * batchSize)}, ${+batchSize}`
    )

    for (const event of rows) {
      if (initialTimestamp == null) {
        initialTimestamp = event.timestamp
      }

      if (
        countEvents++ > maxEventsByTimeframe &&
        event.timestamp !== initialTimestamp
      ) {
        break loop
      }

      await callback({
        ...event,
        payload: JSON.parse(event.payload)
      })
    }

    if (rows.length < batchSize) {
      break
    }
  }
}

export default loadEvents
