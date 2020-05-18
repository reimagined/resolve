const hasEvents = async (pool, events) => {
  const { connection, tableName, escapeId, escape } = pool
  if (!Array.isArray(events) || events.length === 0) {
    return []
  }

  const [rows] = await connection.query(
    `SELECT \`aggregateId\`, \`aggregateVersion\` FROM ${escapeId(tableName)} 
    WHERE ${events
      .map(
        ({ aggregateId, aggregateVersion }) =>
          `( \`aggregateId\` = ${escape(
            aggregateId
          )} AND \`aggregateVersion\` = ${escape(aggregateVersion)} )`
      )
      .join(' OR ')}`
  )

  const resultSet = new Set()
  for (const { aggregateId, aggregateVersion } of rows) {
    resultSet.add(`${aggregateId}-${aggregateVersion}`)
  }

  const result = events.map(({ aggregateId, aggregateVersion }) =>
    resultSet.has(`${aggregateId}-${aggregateVersion}`)
  )

  return result
}

export default hasEvents
