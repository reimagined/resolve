const saveEventOnly = async function(
  { tableName, connection, escapeId, escape },
  event
) {
  await connection.query(
    `INSERT INTO ${escapeId(tableName)}(
      ${escapeId('timestamp')},
      ${escapeId('aggregateId')},
      ${escapeId('aggregateVersion')},
      ${escapeId('type')},
      ${escapeId('payload')}
    ) VALUES(
      ${+event.timestamp},
      ${escape(event.aggregateId)},
      ${+event.aggregateVersion},
      ${escape(event.type)},
      (CAST(${
        event.payload != null
          ? escape(JSON.stringify(event.payload))
          : escape('null')
      } AS JSON))
    )`
  )
}

export default saveEventOnly
