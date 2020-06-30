const saveSnapshot = async (
  {
    databaseName,
    snapshotsTableName,
    executeStatement,
    escapeId,
    escape,
    counters,
    bucketSize
  },
  snapshotKey,
  content
) => {
  const databaseNameAsId = escapeId(databaseName)
  const snapshotsTableNameAsId = escapeId(snapshotsTableName)

  if (snapshotKey == null || snapshotKey.constructor !== String) {
    throw new Error('Snapshot key must be string')
  }
  if (content == null || content.constructor !== String) {
    throw new Error('Snapshot content must be string')
  }

  if (!counters.has(snapshotKey)) {
    counters.set(snapshotKey, 0)
  }

  if (counters.get(snapshotKey) < bucketSize) {
    counters.set(snapshotKey, counters.get(snapshotKey) + 1)
    return
  }
  counters.set(snapshotKey, 0)

  await executeStatement(
    `INSERT INTO ${databaseNameAsId}.${snapshotsTableNameAsId}(
      "snapshotKey", 
      "snapshotContent"
    )
    VALUES(${escape(snapshotKey)}, ${escape(content)})
    ON CONFLICT ("snapshotKey") DO UPDATE
    SET "snapshotContent" = ${escape(content)}`
  )
}

export default saveSnapshot
