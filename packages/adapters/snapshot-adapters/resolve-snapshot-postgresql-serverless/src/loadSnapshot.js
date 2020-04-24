import { LOAD_CHUNK_SIZE } from './constants'

const loadSnapshot = async (pool, snapshotKey) => {
  if (snapshotKey == null || snapshotKey.constructor !== String) {
    throw new Error('Snapshot key must be string')
  }

  let result = null
  for (let index = 0; ; index++) {
    const rows = await pool.executeStatement(
      `SELECT substring(${pool.escapeId('SnapshotContent')} from ${index *
        LOAD_CHUNK_SIZE +
        1} for ${LOAD_CHUNK_SIZE})
      AS ${pool.escapeId('SnapshotContentChunk')}
      FROM ${pool.escapeId(pool.databaseName)}.${pool.escapeId(pool.tableName)}
      WHERE ${pool.escapeId('SnapshotKey')} = ${pool.escape(snapshotKey)} 
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
