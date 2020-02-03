const paginateEvents = async (pool, offset, batchSize) => {
  const { connection, escapeId, tableName } = pool

  const [rows] = await connection.query(
    `SELECT * FROM ${escapeId(tableName)}
    ORDER BY ${escapeId('timestamp')} ASC
    LIMIT ${+offset}, ${+batchSize}`
  )

  for (let index = 0; index < rows.length; index++) {
    const event = rows[index]
    Object.setPrototypeOf(event, Object.prototype)
    event[Symbol.for('sequenceIndex')] = offset + index
  }

  return rows
}

export default paginateEvents
