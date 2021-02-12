import { snapshotTrigger } from '@reimagined/eventstore-base'
import getLog from './get-log'

const saveSnapshot = async (
  pool: any,
  snapshotKey: string,
  content: any
): Promise<any> =>
  snapshotTrigger(pool, snapshotKey, content, async () => {
    const log = getLog(`saveSnapshot:${snapshotKey}`)
    const { snapshotsTableName, connection, escapeId, escape } = pool

    const snapshotsTableNameAsId: string = escapeId(snapshotsTableName)

    log.debug(`writing the snapshot to database`)

    await connection.query(
      `INSERT INTO ${snapshotsTableNameAsId}(\`SnapshotKey\`, \`SnapshotContent\`)
       VALUES(${escape(snapshotKey)}, ${escape(content)})
       ON DUPLICATE KEY UPDATE \`SnapshotContent\` = ${escape(content)}`
    )
    log.debug(`the snapshot saved successfully`)
  })

export default saveSnapshot
