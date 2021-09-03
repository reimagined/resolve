import { AdapterPool } from './types'

const dropSnapshot = async (
  { executeQuery, escape, escapeId, snapshotsTableName }: AdapterPool,
  snapshotKey: string
): Promise<void> => {
  await executeQuery(
    `DELETE FROM ${escapeId(snapshotsTableName)}
    WHERE ${escapeId('snapshotKey')}=
    ${escape(snapshotKey)}`
  )
}

export default dropSnapshot
