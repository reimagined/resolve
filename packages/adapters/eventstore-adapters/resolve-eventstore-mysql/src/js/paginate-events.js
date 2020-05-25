const paginateEvents = async (pool, offset, batchSize) => {
  const {
    events: { connection, tableName },
    escapeId,
    shapeEvent
  } = pool

  const eventsTableNameAsId = escapeId(tableName)

  const [rows] = await connection.query(
    `SELECT * FROM ${eventsTableNameAsId}
    ORDER BY \`timestamp\` ASC
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
