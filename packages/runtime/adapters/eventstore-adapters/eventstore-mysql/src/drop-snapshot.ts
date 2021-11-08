import { AdapterPool } from './types'

const dropSnapshot = async (
  { snapshotsTableName, query, escapeId, escape }: AdapterPool,
  snapshotKey: string
): Promise<void> => {
  const snapshotsTableNameAsId: string = escapeId(snapshotsTableName)
  await query(
    `DELETE FROM ${snapshotsTableNameAsId}
    WHERE \`SnapshotKey\`
    LIKE ${escape(`${snapshotKey}%`)}`
  )
}

export default dropSnapshot
