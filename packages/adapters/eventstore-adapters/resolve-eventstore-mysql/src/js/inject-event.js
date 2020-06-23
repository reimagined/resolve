const injectEvent = async function(
  { events: { eventsTableName, connection }, escapeId, escape },
  event
) {
  const eventsTableNameAsId = escapeId(eventsTableName)
  const threadsTableNameAsId = escapeId(`${eventsTableName}-threads`)
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

  try {
    // prettier-ignore
    await connection.query(
      `START TRANSACTION;
      
      INSERT INTO ${eventsTableNameAsId}(
        \`threadId\`,
        \`threadCounter\`,
        \`timestamp\`,
        \`aggregateId\`,
        \`aggregateVersion\`,
        \`type\`,
        \`payload\`
      ) VALUES(
        ${+event.threadId},
        ${+event.threadCounter},
        ${+event.timestamp},
        ${escape(event.aggregateId)},
        ${+event.aggregateVersion},
        ${escape(event.type)},
        (CAST(${serializedPayload} AS JSON))
      );
      
      UPDATE ${threadsTableNameAsId}
      SET \`threadCounter\` = GREATEST(\`threadCounter\`, ${+event.threadCounter} + 1)
      WHERE \`threadId\` = ${+event.threadId};
      
      COMMIT;`
    )
  } catch (error) {
    try {
      await connection.query(`ROLLBACK;`)
    } catch (e) {}

    throw error
  }
}

export default injectEvent
