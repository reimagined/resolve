import { AdapterPool } from './types'

const loadSnapshot = async (
  { database, escape, escapeId, snapshotsTableName }: AdapterPool,
  snapshotKey: string
): Promise<string | null> => {
  if (snapshotKey == null || snapshotKey.constructor !== String) {
    throw new Error('Snapshot key must be string')
  }

  const result = await database.get(
    `SELECT ${escapeId('content')} 
    FROM ${escapeId(snapshotsTableName)} 
    WHERE ${escapeId('snapshotKey')} = 
    ${escape(snapshotKey)}`
  )

  return result != null ? result.content : null
}

export default loadSnapshot
