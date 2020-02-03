const freeze = async ({
  executeStatement,
  databaseName,
  tableName,
  escapeId
}) => {
  await executeStatement(
    `CREATE TABLE IF NOT EXISTS ${escapeId(databaseName)}.${escapeId(
      `${tableName}-freeze`
    )} (
      ${escapeId('surrogate')} BIGINT NOT NULL,
      PRIMARY KEY(${escapeId('surrogate')})
    );
    COMMENT ON TABLE ${escapeId(databaseName)}.${escapeId(
      `${tableName}-freeze`
    )}
    IS 'RESOLVE EVENT STORE ${escapeId(tableName)} FREEZE MARKER';
    `
  )
}

export default freeze
