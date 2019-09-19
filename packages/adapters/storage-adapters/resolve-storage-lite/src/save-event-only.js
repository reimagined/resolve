const saveEventOnly = async function(
  { tableName, database, escapeId, escape },
  event
) {
  await database.exec(
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
      json(CAST(${
        event.payload != null
          ? escape(JSON.stringify(event.payload))
          : escape('null')
      } AS BLOB))
    )`
  )
}

export default saveEventOnly
