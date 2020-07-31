import { LOAD_CHUNK_SIZE } from './constants'

const loadSnapshot = async (pool, snapshotKey) => {
  const {
    databaseName,
    snapshotsTableName,
    executeStatement,
    escapeId,
    escape
  } = pool
  if (snapshotKey == null || snapshotKey.constructor !== String) {
    throw new Error('Snapshot key must be string')
  }

  const databaseNameAsId = escapeId(databaseName)
  const snapshotsTableNameAsId = escapeId(snapshotsTableName)

  let result = null
  for (let index = 0; ; index++) {
    let rows = null

    while (true) {
      try {
        rows = await executeStatement(
          `SELECT substring(
            "snapshotContent" 
            FROM ${index * LOAD_CHUNK_SIZE + 1}
            FOR ${LOAD_CHUNK_SIZE}
          ) AS "SnapshotContentChunk"
          FROM ${databaseNameAsId}.${snapshotsTableNameAsId}
          WHERE "snapshotKey" = ${escape(snapshotKey)} 
          LIMIT 1`
        )
        break
      } catch (err) {
        if (err != null && /StatementTimeoutException/i.test(err.message)) {
          continue
        }
        throw err
      }
    }

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
