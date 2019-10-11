import { SAVE_CHUNK_SIZE } from './constants'

const saveSnapshot = async (pool, snapshotKey, snapshotValue) => {
  const { escapeId, escape, connect } = pool
  await connect(pool)

  if (!pool.counters.has(snapshotKey)) {
    pool.counters.set(snapshotKey, 0)
  }

  if (pool.counters.get(snapshotKey) < pool.bucketSize) {
    pool.counters.set(snapshotKey, pool.counters.get(snapshotKey) + 1)
    return
  }
  pool.counters.set(snapshotKey, 0)

  const content = String(snapshotValue)
  const chunksCount = Math.ceil(content.length / SAVE_CHUNK_SIZE)

  if (chunksCount > 1) {
    let transactionId = null
    try {
      transactionId = await pool.beginTransaction()

      for (let index = 0; index < chunksCount; index++) {
        const chunk = content.substring(
          index * SAVE_CHUNK_SIZE,
          (index + 1) * SAVE_CHUNK_SIZE
        )

        if (index > 0) {
          await pool.executeStatement(
            `UPDATE ${escapeId(pool.pool.databaseName)}.${escapeId(
              pool.tableName
            )}
            SET ${escapeId('SnapshotContent')} = ${escapeId(
              'SnapshotContent'
            )} || ${escape(chunk)}
            WHERE ${escapeId('SnapshotKey')} = ${escape(snapshotKey)}`,
            transactionId
          )
        } else {
          await pool.executeStatement(
            `INSERT INTO ${escapeId(pool.databaseName)}.${escapeId(
              pool.tableName
            )}(
              ${escapeId('SnapshotKey')}, 
              ${escapeId('SnapshotContent')}
            )
            VALUES(${escape(snapshotKey)}, ${escape(chunk)})
            ON CONFLICT (${escapeId('SnapshotKey')}) DO UPDATE
            SET ${escapeId('SnapshotContent')} = ${escape(chunk)}`,
            transactionId
          )
        }
      }

      await pool.commitTransaction(transactionId)
    } catch (error) {
      await pool.rollbackTransaction(transactionId)

      throw error
    }
  } else {
    await pool.executeStatement(
      `INSERT INTO ${escapeId(pool.databaseName)}.${escapeId(pool.tableName)}(
        ${escapeId('SnapshotKey')}, 
        ${escapeId('SnapshotContent')}
      )
      VALUES(${escape(snapshotKey)}, ${escape(content)})
      ON CONFLICT (${escapeId('SnapshotKey')}) DO UPDATE
      SET ${escapeId('SnapshotContent')} = ${escape(content)}`
    )
  }
}

export default saveSnapshot
