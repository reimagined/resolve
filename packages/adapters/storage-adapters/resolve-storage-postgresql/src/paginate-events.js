const paginateEvents = async (pool, offset, batchSize) => {
  const {
    escapeId,
    tableName,
    databaseName,
    executeStatement,
    shapeEvent
  } = pool

  const databaseNameAsId = escapeId(databaseName)
  const eventsTableNameAsId = escapeId(tableName)

  const rows = await executeStatement(
    `SELECT * FROM ${databaseNameAsId}.${eventsTableNameAsId}
    ORDER BY "timestamp" ASC
    OFFSET ${offset}
    LIMIT ${+batchSize}`
  )

  let eventOffset = 0
  const resultRows = []
  for (const event of rows) {
    resultRows.push(
      shapeEvent(event, { [Symbol.for('sequenceIndex')]: offset + eventOffset })
    )
    eventOffset++
  }

  return resultRows
}

export default paginateEvents
