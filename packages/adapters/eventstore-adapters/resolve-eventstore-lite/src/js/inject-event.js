const injectEvent = async function (
  { eventsTableName, database, escapeId, escape },
  event
) {
  const eventsTableNameAsId = escapeId(eventsTableName)
  const serializedPayload =
    event.payload != null
      ? escape(JSON.stringify(event.payload))
      : escape('null')

  const missingFields = []
  if (event.threadId == null) {
    missingFields.push(`"threadId"`)
  }
  if (event.threadCounter == null) {
    missingFields.push(`"threadCounter"`)
  }
  if (event.timestamp == null) {
    missingFields.push(`"timestamp"`)
  }
  if (missingFields.length > 0) {
    throw new Error(
      `The field ${missingFields.join(', ')} is required in ${JSON.stringify(
        event
      )}`
    )
  }

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
      ${+event.threadId},
      ${+event.threadCounter},
      ${+event.timestamp},
      ${escape(event.aggregateId)},
      ${+event.aggregateVersion},
      ${escape(event.type)},
      json(CAST(${serializedPayload} AS BLOB))
    )`
  )
}

export default injectEvent
