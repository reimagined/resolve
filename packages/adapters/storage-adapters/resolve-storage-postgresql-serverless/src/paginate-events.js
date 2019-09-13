const paginateEvents = async (pool, offset, batchSize) => {
  const { escapeId, tableName, databaseName, executeStatement } = pool

  const query = [
    `WITH ${escapeId('cte')} AS (`,
    `  SELECT ${escapeId('filteredEvents')}.*,`,
    `  SUM(${escapeId('filteredEvents')}.${escapeId('eventSize')})`,
    `  OVER (ORDER BY ${escapeId('filteredEvents')}.${escapeId(
      'eventId'
    )}) AS ${escapeId('totalEventSize')}`,
    `  FROM (`,
    `    SELECT * FROM ${escapeId(databaseName)}.${escapeId(tableName)}`,
    `    ORDER BY ${escapeId('eventId')} ASC`,
    `    OFFSET ${offset}`,
    `    LIMIT ${+batchSize}`,
    `  ) ${escapeId('filteredEvents')}`,
    `)`,
    `SELECT * FROM ${escapeId('cte')}`,
    `WHERE ${escapeId('cte')}.${escapeId('totalEventSize')} < 512000`,
    `ORDER BY ${escapeId('cte')}.${escapeId('eventId')} ASC`
  ].join(' ')

  const rows = await executeStatement(query)
  for (const event of rows) {
    event.payload = JSON.parse(event.payload)

    delete event.totalEventSize
    delete event.eventSize
  }

  return rows
}

export default paginateEvents
