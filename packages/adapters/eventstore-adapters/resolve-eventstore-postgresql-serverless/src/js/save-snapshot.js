import { SAVE_CHUNK_SIZE } from './constants'

const saveSnapshot = async (pool, snapshotKey, content) => {
  const {
    databaseName,
    snapshotsTableName,
    executeStatement,
    escapeId,
    escape,
    counters,
    bucketSize,
    beginTransaction,
    commitTransaction,
    rollbackTransaction
  } = pool
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

  const chunksCount = Math.ceil(content.length / SAVE_CHUNK_SIZE)

  if (chunksCount > 1) {
    let transactionId = null
    try {
      transactionId = await beginTransaction(pool)

      for (let index = 0; index < chunksCount; index++) {
        const chunk = content.substring(
          index * SAVE_CHUNK_SIZE,
          (index + 1) * SAVE_CHUNK_SIZE
        )

        if (index > 0) {
          await executeStatement(
            `UPDATE ${databaseNameAsId}.${snapshotsTableNameAsId}
            SET "snapshotContent" = "snapshotContent" || ${escape(chunk)}
            WHERE "snapshotKey" = ${escape(snapshotKey)}`,
            transactionId
          )
        } else {
          await executeStatement(
            `INSERT INTO ${databaseNameAsId}.${snapshotsTableNameAsId}(
              "snapshotKey", 
              "snapshotContent"
            )
            VALUES(${escape(snapshotKey)}, ${escape(chunk)})
            ON CONFLICT ("snapshotKey") DO UPDATE
            SET "snapshotContent" = ${escape(chunk)}`,
            transactionId
          )
        }
      }

      await commitTransaction(pool, transactionId)
    } catch (error) {
      await rollbackTransaction(pool, transactionId)

      throw error
    }
  } else {
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
}

export default saveSnapshot
