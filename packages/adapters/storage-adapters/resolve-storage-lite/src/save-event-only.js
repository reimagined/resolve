const saveEventOnly = async function(
  { tableName, database, escapeId, escape },
  event
) {
  const currentThreadId = Math.floor(Math.random() * 256)
  await database.exec(
    `INSERT INTO ${escapeId(tableName)}(
      ${escapeId('threadId')},
      ${escapeId('threadCounter')},
      ${escapeId('timestamp')},
      ${escapeId('aggregateId')},
      ${escapeId('aggregateVersion')},
      ${escapeId('type')},
      ${escapeId('payload')}
    ) VALUES(
      ${+currentThreadId},
      COALESCE(
        (SELECT MAX(${escapeId('threadCounter')}) FROM ${escapeId(tableName)}
        WHERE ${escapeId('threadId')} = ${+currentThreadId}) + 1,
        0
      ),
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
