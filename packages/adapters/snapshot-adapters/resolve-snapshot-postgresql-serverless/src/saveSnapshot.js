import { SAVE_CHUNK_SIZE } from './constants'

const saveSnapshot = async (pool, snapshotKey, content) => {
  if (snapshotKey == null || snapshotKey.constructor !== String) {
    throw new Error('Snapshot key must be string')
  }
  if (content == null || content.constructor !== String) {
    throw new Error('Snapshot content must be string')
  }

  if (!pool.counters.has(snapshotKey)) {
    pool.counters.set(snapshotKey, 0)
  }

  if (pool.counters.get(snapshotKey) < pool.bucketSize) {
    pool.counters.set(snapshotKey, pool.counters.get(snapshotKey) + 1)
    return
  }
  pool.counters.set(snapshotKey, 0)

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
            `UPDATE ${pool.escapeId(pool.databaseName)}.${pool.escapeId(
              pool.tableName
            )}
            SET ${pool.escapeId('SnapshotContent')} = ${pool.escapeId(
              'SnapshotContent'
            )} || ${pool.escape(chunk)}
            WHERE ${pool.escapeId('SnapshotKey')} = ${pool.escape(
              snapshotKey
            )}`,
            transactionId
          )
        } else {
          await pool.executeStatement(
            `INSERT INTO ${pool.escapeId(pool.databaseName)}.${pool.escapeId(
              pool.tableName
            )}(
              ${pool.escapeId('SnapshotKey')}, 
              ${pool.escapeId('SnapshotContent')}
            )
            VALUES(${pool.escape(snapshotKey)}, ${pool.escape(chunk)})
            ON CONFLICT (${pool.escapeId('SnapshotKey')}) DO UPDATE
            SET ${pool.escapeId('SnapshotContent')} = ${pool.escape(chunk)}`,
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
      `INSERT INTO ${pool.escapeId(pool.databaseName)}.${pool.escapeId(
        pool.tableName
      )}(
        ${pool.escapeId('SnapshotKey')}, 
        ${pool.escapeId('SnapshotContent')}
      )
      VALUES(${pool.escape(snapshotKey)}, ${pool.escape(content)})
      ON CONFLICT (${pool.escapeId('SnapshotKey')}) DO UPDATE
      SET ${pool.escapeId('SnapshotContent')} = ${pool.escape(content)}`
    )
  }
}

export default saveSnapshot
