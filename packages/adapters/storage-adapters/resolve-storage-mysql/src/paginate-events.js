const paginateEvents = async (pool, offset, batchSize) => {
  const { connection, escapeId, tableName } = pool

  const eventsTableNameAsId = escapeId(tableName)

  const [rows] = await connection.query(
    `SELECT * FROM ${eventsTableNameAsId}
    ORDER BY \`timestamp\` ASC
    LIMIT ${+offset}, ${+batchSize}`
  )

  for (let index = 0; index < rows.length; index++) {
    const event = rows[index]
    Object.setPrototypeOf(event, Object.prototype)
    event[Symbol.for('sequenceIndex')] = offset + index

    delete event.threadId
    delete event.threadCounter
  }

  return rows
}

export default paginateEvents
