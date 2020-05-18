const unfreeze = async ({
  executeStatement,
  databaseName,
  tableName,
  escapeId
}) => {
  const databaseNameAsId = escapeId(databaseName)
  const freezeTableNameAsId = escapeId(`${tableName}-freeze`)

  await executeStatement(
    `DROP TABLE IF EXISTS ${databaseNameAsId}.${freezeTableNameAsId}`
  )
}

export default unfreeze
