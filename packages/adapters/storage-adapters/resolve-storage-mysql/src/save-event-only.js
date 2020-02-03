const saveEventOnly = async function(
  { tableName, connection, escapeId, escape },
  event
) {
  await connection.query(
    `START TRANSACTION;
    SET @selectedThreadId = FLOOR(RAND() * 256);
    INSERT INTO ${escapeId(tableName)}(
      ${escapeId('threadId')},
      ${escapeId('threadCounter')},
      ${escapeId('timestamp')},
      ${escapeId('aggregateId')},
      ${escapeId('aggregateVersion')},
      ${escapeId('type')},
      ${escapeId('payload')}
    ) VALUES(
      @selectedThreadId,
      COALESCE(
        (SELECT MAX(${escapeId('threadCounter')}) FROM ${escapeId(tableName)}
        WHERE ${escapeId('threadId')} = @selectedThreadId) + 1,
        0
      ),
      ${+event.timestamp},
      ${escape(event.aggregateId)},
      ${+event.aggregateVersion},
      ${escape(event.type)},
      (CAST(${
        event.payload != null
          ? escape(JSON.stringify(event.payload))
          : escape('null')
      } AS JSON))
    );
    COMMIT;`
  )
}

export default saveEventOnly
