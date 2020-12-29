import { AdapterPool } from './types'

const dropSnapshot = async (
  pool: AdapterPool,
  snapshotKey: string
): Promise<any> => {
  await pool.database.exec(
    `DELETE FROM ${pool.escapeId(pool.snapshotsTableName)}
    WHERE ${pool.escapeId('snapshotKey')}=
    ${pool.escape(snapshotKey)}`
  )
}

export default dropSnapshot
