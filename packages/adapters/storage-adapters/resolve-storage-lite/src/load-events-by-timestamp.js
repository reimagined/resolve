import createQuery from './create-query'

const loadEventsByTimestamp = async (pool, filter, callback) => {
  const { database, escapeId, tableName } = pool
  const batchSize = filter.limit != null ? filter.limit : 0x7fffffff

  const resultQueryCondition = createQuery(pool, filter)

  const rows = await database.all(
    `SELECT * FROM ${escapeId(tableName)} ${resultQueryCondition}
    ORDER BY ${escapeId('timestamp')} ASC
    LIMIT 0, ${+batchSize}`
  )

  for (const event of rows) {
    event.payload = JSON.parse(event.payload)

    delete event.threadId
    delete event.threadCounter

    await callback(event)
  }
}

export default loadEventsByTimestamp
