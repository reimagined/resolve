const paginateEvents = async (pool, offset, batchSize) => {
  const { escapeId, tableName, databaseName, executeStatement } = pool

  const databaseNameAsId = escapeId(databaseName)
  const eventsTableNameAsId = escapeId(tableName)

  const rows = await executeStatement(
    `SELECT * FROM ${databaseNameAsId}.${eventsTableNameAsId}
    ORDER BY "timestamp" ASC
    OFFSET ${offset}
    LIMIT ${+batchSize}`
  )

  let eventOffset = 0
  for (const event of rows) {
    event[Symbol.for('sequenceIndex')] = offset + eventOffset
    eventOffset++

    delete event.threadId
    delete event.threadCounter
    delete event.totalEventSize
    delete event.eventSize
  }

  return rows
}

export default paginateEvents
