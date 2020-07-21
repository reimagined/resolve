import { snapshotTrigger } from 'resolve-eventstore-base'
import getLog from './get-log'

const saveSnapshot = async (pool, snapshotKey, content) =>
  snapshotTrigger(pool, snapshotKey, content, async () => {
    const log = getLog(`saveSnapshot:${snapshotKey}`)

    const {
      databaseName,
      snapshotsTableName,
      escape,
      escapeId,
      executeStatement
    } = pool

    const databaseNameAsId = escapeId(databaseName)
    const snapshotsTableNameAsId = escapeId(snapshotsTableName)

    log.debug(`writing the snapshot to database`)
    await executeStatement(
      `INSERT INTO ${databaseNameAsId}.${snapshotsTableNameAsId}(
      "snapshotKey", 
      "snapshotContent"
    )
    VALUES(${escape(snapshotKey)}, ${escape(content)})
    ON CONFLICT ("snapshotKey") DO UPDATE
    SET "snapshotContent" = ${escape(content)}`
    )
    log.debug(`the snapshot saved successfully`)
  })

export default saveSnapshot
