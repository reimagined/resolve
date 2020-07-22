import { snapshotTrigger } from 'resolve-eventstore-base'
import getLog from './get-log'

const saveSnapshot = async (pool, snapshotKey, content) =>
  snapshotTrigger(pool, snapshotKey, content, async () => {
    const log = getLog(`saveSnapshot:${snapshotKey}`)
    const { escape, escapeId, database, snapshotsTableName } = pool

    log.debug(`writing the snapshot to database`)
    await database.exec(
      `REPLACE INTO ${escapeId(snapshotsTableName)} 
       VALUES (${escape(snapshotKey)}, ${escape(content)})`
    )
    log.debug(`the snapshot saved successfully`)
  })

export default saveSnapshot
