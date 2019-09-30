const init = async ({ database, tableName, escapeId }) => {
  await database.exec(
    `CREATE TABLE ${escapeId(tableName)}(
      ${escapeId('timestamp')} BIGINT NOT NULL,
      ${escapeId('aggregateId')} VARCHAR(700) NOT NULL,
      ${escapeId('aggregateVersion')} BIGINT NOT NULL,
      ${escapeId('type')} VARCHAR(700) NOT NULL,
      ${escapeId('payload')} JSON NULL,
      PRIMARY KEY(${escapeId('aggregateId')}, ${escapeId('aggregateVersion')})
    );
    CREATE INDEX ${escapeId('aggregateId-idx')} ON ${escapeId(tableName)}(
      ${escapeId('aggregateId')}
    );
    CREATE INDEX ${escapeId('aggregateVersion-idx')} ON ${escapeId(tableName)}(
      ${escapeId('aggregateVersion')}
    );
    CREATE INDEX ${escapeId('type-idx')} ON ${escapeId(tableName)}(
      ${escapeId('type')}
    );
    CREATE INDEX ${escapeId('timestamp-idx')} ON ${escapeId(tableName)}(
      ${escapeId('timestamp')}
    )
    `
  )
}

export default init
