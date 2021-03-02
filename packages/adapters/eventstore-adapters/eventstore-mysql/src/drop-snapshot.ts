import { AdapterPool } from './types'

const dropSnapshot = async (
  { snapshotsTableName, connection, escapeId, escape }: AdapterPool,
  snapshotKey: string
): Promise<void> => {
  const snapshotsTableNameAsId: string = escapeId(snapshotsTableName)
  await connection.query(
    `DELETE FROM ${snapshotsTableNameAsId}
    WHERE \`SnapshotKey\`
    LIKE ${escape(`${snapshotKey}%`)}`
  )
}

export default dropSnapshot
