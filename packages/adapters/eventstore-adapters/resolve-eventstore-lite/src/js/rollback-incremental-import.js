const rollbackIncrementalImport = async ({
  database,
  eventsTableName,
  escapeId
}) => {
  try {
    const incrementalImportTableAsId = escapeId(
      `${eventsTableName}-incremental-import`
    )
    await database.exec(`DROP TABLE ${incrementalImportTableAsId};`)
  } catch (error) {
    if (error != null && /^SQLITE_ERROR:.*? not exists$/.test(error.message)) {
      throw new Error(`Previous incremental import does not exist`)
    } else {
      throw error
    }
  }
}

export default rollbackIncrementalImport
