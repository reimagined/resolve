const dropSnapshot = async (
  { databaseName, tableName, executeStatement, escapeId, escape },
  snapshotKey
) => {
  const databaseNameAsId = escapeId(databaseName)
  const snapshotsTableNameAsId = escapeId(`${tableName}-snapshots`)

  await executeStatement(
    `DELETE FROM ${databaseNameAsId}.${snapshotsTableNameAsId}
    WHERE "snapshotKey" LIKE ${escape(`${snapshotKey}%`)}`
  )
}

export default dropSnapshot
