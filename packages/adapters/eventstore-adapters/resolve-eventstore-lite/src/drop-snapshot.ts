import { AdapterPool } from './types'

const dropSnapshot = async (
  { database, escape, escapeId, snapshotsTableName }: AdapterPool,
  snapshotKey: string
): Promise<void> => {
  await database.exec(
    `DELETE FROM ${escapeId(snapshotsTableName)}
    WHERE ${escapeId('snapshotKey')}=
    ${escape(snapshotKey)}`
  )
}

export default dropSnapshot
