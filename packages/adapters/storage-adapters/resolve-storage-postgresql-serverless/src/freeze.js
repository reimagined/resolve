const freeze = async ({
  executeStatement,
  databaseName,
  tableName,
  escapeId
}) => {
  const databaseNameAsId = escapeId(databaseName)
  const freezeTableNameAsId = escapeId(`${tableName}-freeze`)

  await executeStatement(
    `CREATE TABLE IF NOT EXISTS ${databaseNameAsId}.${freezeTableNameAsId} (
      "surrogate" BIGINT NOT NULL,
      PRIMARY KEY("surrogate")
    );
    COMMENT ON TABLE ${databaseNameAsId}.${freezeTableNameAsId}
    IS 'RESOLVE EVENT STORE ${freezeTableNameAsId} FREEZE MARKER';
    `
  )
}

export default freeze
