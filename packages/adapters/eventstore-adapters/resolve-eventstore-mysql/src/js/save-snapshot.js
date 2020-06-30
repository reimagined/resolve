const saveSnapshot = async (
  {
    events: { snapshotsTableName, connection },
    escapeId,
    escape,
    counters,
    bucketSize
  },
  snapshotKey,
  content
) => {
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

  const snapshotsTableNameAsId = escapeId(snapshotsTableName)

  await connection.query(
    `INSERT INTO ${snapshotsTableNameAsId}(\`SnapshotKey\`, \`SnapshotContent\`)
    VALUES(${escape(snapshotKey)}, ${escape(content)})
    ON DUPLICATE KEY UPDATE \`SnapshotContent\` = ${escape(content)}`
  )
}

export default saveSnapshot
