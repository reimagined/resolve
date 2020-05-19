const paginateEvents = async (pool, offset, batchSize) => {
  const { database, escapeId, tableName, shapeEvent } = pool

  const eventsTableNameAsId = escapeId(tableName)

  const rows = await database.all(
    `SELECT * FROM ${eventsTableNameAsId}
    ORDER BY "timestamp" ASC
    LIMIT ${+offset}, ${+batchSize}`
  )

  const resultRows = []
  for (let index = 0; index < rows.length; index++) {
    const event = rows[index]
    resultRows.push(
      shapeEvent(event, { [Symbol.for('sequenceIndex')]: offset + index })
    )
  }

  return resultRows
}

export default paginateEvents
