const unfreeze = async ({
  executeStatement,
  databaseName,
  tableName,
  escapeId
}) => {
  await executeStatement(
    `DROP TABLE IF EXISTS ${escapeId(databaseName)}.${escapeId(
      `${tableName}-freeze`
    )}`
  )
}

export default unfreeze
