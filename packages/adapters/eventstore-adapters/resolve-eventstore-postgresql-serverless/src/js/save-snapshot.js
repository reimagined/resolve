import getLog from './get-log'
import { snapshotTrigger } from 'resolve-eventstore-base'
import { SAVE_CHUNK_SIZE } from './constants'

const saveSnapshot = async (pool, snapshotKey, content) =>
  snapshotTrigger(pool, snapshotKey, content, async () => {
    const log = getLog(`saveSnapshot:${snapshotKey}`)

    const {
      databaseName,
      snapshotsTableName,
      executeStatement,
      escapeId,
      escape,
      beginTransaction,
      commitTransaction,
      rollbackTransaction
    } = pool

    const databaseNameAsId = escapeId(databaseName)
    const snapshotsTableNameAsId = escapeId(snapshotsTableName)

    const chunksCount = Math.ceil(content.length / SAVE_CHUNK_SIZE)

    if (chunksCount > 1) {
      log.debug(`writing the snapshot to database (chunked)`)
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
      log.debug(`writing the snapshot to database (whole)`)
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
    log.debug(`the snapshot saved successfully`)
  })

export default saveSnapshot
