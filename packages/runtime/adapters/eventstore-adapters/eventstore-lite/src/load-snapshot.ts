import { AdapterPool } from './types'

const loadSnapshot = async (
  { executeStatement, escape, escapeId, snapshotsTableName }: AdapterPool,
  snapshotKey: string
): Promise<string | null> => {
  if (snapshotKey == null || snapshotKey.constructor !== String) {
    throw new Error('Snapshot key must be a string')
  }

  const result = await executeStatement(
    `SELECT ${escapeId('content')} 
    FROM ${escapeId(snapshotsTableName)} 
    WHERE ${escapeId('snapshotKey')} = 
    ${escape(snapshotKey)}`
  )

  return result.length > 0 && result[0] != null ? result[0].content : null
}

export default loadSnapshot
