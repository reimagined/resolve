const dispose = async ({
  executeStatement,
  databaseName,
  escapeId,
  escape,
  tableName
}) => {
  await executeStatement(
    `DELETE FROM ${escapeId(databaseName)}.${escapeId(tableName)}`
  )

  await executeStatement(
    `DELETE FROM ${escapeId(databaseName)}.${escapeId(tableName + '-sequence')}`
  )

  await executeStatement(
    `INSERT INTO ${escapeId(databaseName)}.${escapeId(
      tableName + '-sequence'
    )} VALUES(0,0,0, ${escape('0')} )`
  )
}

export default dispose
