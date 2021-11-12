import { snapshotTrigger } from '@resolve-js/eventstore-base'
import { getLog } from './get-log'
import { AdapterPool } from './types'

const saveSnapshot = async (
  pool: AdapterPool,
  snapshotKey: string,
  content: string
): Promise<void> =>
  snapshotTrigger(pool, snapshotKey, content, async () => {
    const log = getLog(`saveSnapshot:${snapshotKey}`)
    const { snapshotsTableName, escapeId, escape } = pool

    const snapshotsTableNameAsId: string = escapeId(snapshotsTableName)

    log.debug(`writing the snapshot to database`)

    await pool.query(
      `INSERT INTO ${snapshotsTableNameAsId}(\`SnapshotKey\`, \`SnapshotContent\`)
       VALUES(${escape(snapshotKey)}, ${escape(content)})
       ON DUPLICATE KEY UPDATE \`SnapshotContent\` = ${escape(content)}`
    )
    log.debug(`the snapshot saved successfully`)
  })

export default saveSnapshot
