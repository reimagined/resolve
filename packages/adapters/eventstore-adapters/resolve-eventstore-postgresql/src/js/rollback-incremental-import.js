const rollbackIncrementalImport = async ({
  executeStatement,
  databaseName,
  eventsTableName,
  escapeId,
}) => {
  const databaseNameAsId = escapeId(databaseName)
  const incrementalImportTableAsId = escapeId(
    `${eventsTableName}-incremental-import`
  )
  await executeStatement(
    `DROP TABLE IF EXISTS ${databaseNameAsId}.${incrementalImportTableAsId};`
  )
}

export default rollbackIncrementalImport
