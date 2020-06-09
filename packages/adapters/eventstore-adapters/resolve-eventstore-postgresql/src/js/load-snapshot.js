import { LOAD_CHUNK_SIZE } from './constants'

const loadSnapshot = async (
  { databaseName, snapshotsTableName, executeStatement, escapeId, escape },
  snapshotKey
) => {
  if (snapshotKey == null || snapshotKey.constructor !== String) {
    throw new Error('Snapshot key must be string')
  }

  const databaseNameAsId = escapeId(databaseName)
  const snapshotsTableNameAsId = escapeId(snapshotsTableName)

  let result = null
  for (let index = 0; ; index++) {
    const rows = await executeStatement(
      `SELECT substring("snapshotContent" from ${index * LOAD_CHUNK_SIZE +
        1} for ${LOAD_CHUNK_SIZE})
      AS "SnapshotContentChunk"
      FROM ${databaseNameAsId}.${snapshotsTableNameAsId}
      WHERE "snapshotKey" = ${escape(snapshotKey)} 
      LIMIT 1`
    )

    const content = rows.length > 0 ? rows[0].SnapshotContentChunk : null
    if (content == null) {
      break
    } else if (content != null && result == null) {
      result = ''
    }

    result += content

    if (content.length < LOAD_CHUNK_SIZE) {
      break
    }
  }

  return result
}

export default loadSnapshot
