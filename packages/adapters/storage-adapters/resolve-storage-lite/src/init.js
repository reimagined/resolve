const init = async ({ database, escapeId, tableName }) => {
  await database.exec(
    `CREATE TABLE IF NOT EXISTS ${escapeId(tableName)}(
      ${escapeId('timestamp')} BIGINT NOT NULL,
      ${escapeId('aggregateId')} VARCHAR(700) NOT NULL,
      ${escapeId('aggregateVersion')} BIGINT NOT NULL,
      ${escapeId('type')} VARCHAR(700) NOT NULL,
      ${escapeId('payload')} JSON NULL,
      PRIMARY KEY(${escapeId('aggregateId')}, ${escapeId('aggregateVersion')})
    );
    CREATE INDEX IF NOT EXISTS ${escapeId('aggregateId-idx')} ON ${escapeId(
      tableName
    )}(
      ${escapeId('aggregateId')}
    );
    CREATE INDEX IF NOT EXISTS ${escapeId(
      'aggregateVersion-idx'
    )} ON ${escapeId(tableName)}(
      ${escapeId('aggregateVersion')}
    );
    CREATE INDEX IF NOT EXISTS ${escapeId('type-idx')} ON ${escapeId(
      tableName
    )}(
      ${escapeId('type')}
    );
    CREATE INDEX IF NOT EXISTS ${escapeId('timestamp-idx')} ON ${escapeId(
      tableName
    )}(
      ${escapeId('timestamp')}
    )
    `
  )
}

export default init
