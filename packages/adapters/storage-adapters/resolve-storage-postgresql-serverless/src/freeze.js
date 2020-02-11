const freeze = async ({
  executeStatement,
  databaseName,
  tableName,
  escapeId,
  escape
}) => {
  const databaseNameAsId = escapeId(databaseName)
  const freezeTableNameAsId = escapeId(`${tableName}-freeze`)
  const freezeTableNameAsString = escape(`${tableName}-freeze`)

  await executeStatement(
    `CREATE TABLE IF NOT EXISTS ${databaseNameAsId}.${freezeTableNameAsId} (
      "surrogate" BIGINT NOT NULL,
      PRIMARY KEY("surrogate")
    );
    COMMENT ON TABLE ${databaseNameAsId}.${freezeTableNameAsId}
    IS 'RESOLVE EVENT STORE ${freezeTableNameAsString} FREEZE MARKER';
    `
  )
}

export default freeze
