const saveEventOnly = async function(
  { events: { tableName, connection }, escapeId, escape },
  event
) {
  const eventsTableNameAsId = escapeId(tableName)
  const threadsTableNameAsId = escapeId(`${tableName}-threads`)
  const serializedPayload =
    event.payload != null
      ? escape(JSON.stringify(event.payload))
      : escape('null')

  try {
    // prettier-ignore
    await connection.query(
      `START TRANSACTION;
      SET @selectedThreadId = FLOOR(RAND() * 256);
      
      INSERT INTO ${eventsTableNameAsId}(
        \`threadId\`,
        \`threadCounter\`,
        \`timestamp\`,
        \`aggregateId\`,
        \`aggregateVersion\`,
        \`type\`,
        \`payload\`
      ) VALUES(
        @selectedThreadId,
        COALESCE(
          (
            SELECT \`threadCounter\` FROM ${threadsTableNameAsId}
            WHERE \`threadId\` = @selectedThreadId
          ),
          0
        ),
        ${+event.timestamp},
        ${escape(event.aggregateId)},
        ${+event.aggregateVersion},
        ${escape(event.type)},
        (CAST(${serializedPayload} AS JSON))
      );
      
      UPDATE ${threadsTableNameAsId}
      SET \`threadCounter\` = \`threadCounter\` + 1
      WHERE \`threadId\` = @selectedThreadId;
      
      COMMIT;`
    )
  } catch (error) {
    try {
      await connection.query(`ROLLBACK;`)
    } catch (e) {}

    throw error
  }
}

export default saveEventOnly
