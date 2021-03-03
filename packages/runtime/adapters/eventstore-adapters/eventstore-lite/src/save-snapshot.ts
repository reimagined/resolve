import { snapshotTrigger } from '@resolve-js/eventstore-base'
import getLog from './get-log'
import { AdapterPool } from './types'

const saveSnapshot = async (
  pool: AdapterPool,
  snapshotKey: string,
  content: string
): Promise<void> =>
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
