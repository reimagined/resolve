import { LOAD_CHUNK_SIZE } from './constants'

const loadSnapshot = async (pool, snapshotKey) => {
  const { escapeId, escape, connect } = pool
  await connect(pool)

  let result = null

  for (let index = 0; ; index++) {
    const rows = await pool.executeStatement(
      `SELECT substring(${escapeId('SnapshotContent')} from ${index *
        LOAD_CHUNK_SIZE +
        1} for ${LOAD_CHUNK_SIZE})
      AS ${escapeId('SnapshotContentChunk')}
      FROM ${escapeId(pool.databaseName)}.${escapeId(pool.tableName)}
      WHERE ${escapeId('SnapshotKey')} = ${escape(snapshotKey)} 
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
