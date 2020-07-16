const rollbackIncrementalImport = async ({
  executeStatement,
  databaseName,
  eventsTableName,
  escapeId
}) => {
  try {
    const databaseNameAsId = escapeId(databaseName)
    const incrementalImportTableAsId = escapeId(
      `${eventsTableName}-incremental-import`
    )
    await executeStatement(
      `DROP TABLE ${databaseNameAsId}.${incrementalImportTableAsId};`
    )
  } catch (error) {
    if (error != null && /Table.*? does not exist$/i.test(error.message)) {
      throw new Error(`Previous incremental import does not exist`)
    } else {
      throw error
    }
  }
}

export default rollbackIncrementalImport
