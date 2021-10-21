import { AdapterPool } from './types'

const loadSnapshot = async (
  { snapshotsTableName, query, escapeId, escape }: AdapterPool,
  snapshotKey: string
): Promise<string | null> => {
  if (snapshotKey == null || snapshotKey.constructor !== String) {
    throw new Error('Snapshot key must be a string')
  }

  const snapshotsTableNameAsId: string = escapeId(snapshotsTableName)

  const [rows] = await query(
    `SELECT \`SnapshotContent\` FROM ${snapshotsTableNameAsId}
   WHERE \`SnapshotKey\`= ${escape(snapshotKey)} `
  )
  return rows.length > 0 ? rows[0].SnapshotContent.toString() : null
}

export default loadSnapshot
