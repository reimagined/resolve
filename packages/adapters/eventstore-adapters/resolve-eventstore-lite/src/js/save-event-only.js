const saveEventOnly = async function(
  { eventsTableName, database, escapeId, escape },
  event
) {
  const currentThreadId = Math.floor(Math.random() * 256)
  const eventsTableNameAsId = escapeId(eventsTableName)
  const serializedPayload =
    event.payload != null
      ? escape(JSON.stringify(event.payload))
      : escape('null')

  // prettier-ignore
  await database.exec(
    `INSERT INTO ${eventsTableNameAsId}(
      "threadId",
      "threadCounter",
      "timestamp",
      "aggregateId",
      "aggregateVersion",
      "type",
      "payload"
    ) VALUES(
      ${+currentThreadId},
      COALESCE(
        (
          SELECT MAX("threadCounter") FROM ${eventsTableNameAsId}
          WHERE "threadId" = ${+currentThreadId}
        ) + 1,
        0
      ),
      ${+event.timestamp},
      ${escape(event.aggregateId)},
      ${+event.aggregateVersion},
      ${escape(event.type)},
      json(CAST(${serializedPayload} AS BLOB))
    )`
  )
}

export default saveEventOnly
