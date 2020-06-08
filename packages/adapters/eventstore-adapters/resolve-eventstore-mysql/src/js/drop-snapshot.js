const dropSnapshot = async (
  { events: { snapshotsTableName, connection }, escapeId, escape },
  snapshotKey
) => {
  const snapshotsTableNameAsId = escapeId(snapshotsTableName)
  await connection.query(
    `DELETE FROM ${snapshotsTableNameAsId}
    WHERE \`SnapshotKey\`
    LIKE ${escape(`${snapshotKey}%`)}`,
    [snapshotKey]
  )
}

export default dropSnapshot
