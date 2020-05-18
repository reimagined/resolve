import createQuery from './create-query'

const loadEventsByTimestamp = async (pool, filter, callback) => {
  const { database, escapeId, tableName, shapeEvent } = pool
  const batchSize = filter.limit != null ? filter.limit : 0x7fffffff

  const resultQueryCondition = createQuery(pool, filter)

  const tableNameAsId = escapeId(tableName)

  const rows = await database.all(
    `SELECT * FROM ${tableNameAsId}
    ${resultQueryCondition}
    ORDER BY "timestamp" ASC
    LIMIT 0, ${+batchSize}`
  )

  for (const event of rows) {
    await callback(shapeEvent(event))
  }
}

export default loadEventsByTimestamp
