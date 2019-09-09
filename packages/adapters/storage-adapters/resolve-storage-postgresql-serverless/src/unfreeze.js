const unfreeze = async ({
  executeStatement,
  databaseName,
  tableName,
  escapeId
}) => {
  await executeStatement(
    `DROP TABLE ${escapeId(databaseName)}.${escapeId(`${tableName}-freeze`)}`
  )
}

export default unfreeze
