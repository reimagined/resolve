const paginateEvents = async (pool, offset, batchSize) => {
  const { database, escapeId, tableName } = pool

  const rows = await database.all(
    `SELECT * FROM ${escapeId(tableName)}
    ORDER BY ${escapeId('timestamp')} ASC,
    ${escapeId('aggregateVersion')} ASC
    LIMIT ${+offset}, ${+batchSize}`
  )

  for (let index = 0; index < rows.length; index++) {
    const event = rows[index]
    event.payload = JSON.parse(event.payload)
    event.eventId = offset + index
  }

  return rows
}

export default paginateEvents
