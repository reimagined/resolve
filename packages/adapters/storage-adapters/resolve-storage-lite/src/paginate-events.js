const paginateEvents = async (pool, offset, batchSize) => {
  const { database, escapeId, tableName } = pool

  const eventsTableNameAsId = escapeId(tableName)

  const rows = await database.all(
    `SELECT * FROM ${eventsTableNameAsId}
    ORDER BY "timestamp" ASC
    LIMIT ${+offset}, ${+batchSize}`
  )

  for (let index = 0; index < rows.length; index++) {
    const event = rows[index]
    event.payload = JSON.parse(event.payload)
    event[Symbol.for('sequenceIndex')] = offset + index

    delete event.threadId
    delete event.threadCounter
  }

  return rows
}

export default paginateEvents
