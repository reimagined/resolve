import { AdapterPool } from './types'

const loadSnapshot = async (
  {
    databaseName,
    snapshotsTableName,
    executeStatement,
    escapeId,
    escape,
  }: AdapterPool,
  snapshotKey: string
): Promise<string | null> => {
  if (snapshotKey == null || snapshotKey.constructor !== String) {
    throw new Error('Snapshot key must be string')
  }

  const databaseNameAsId = escapeId(databaseName)
  const snapshotsTableNameAsId = escapeId(snapshotsTableName)

  const rows = await executeStatement(
    `SELECT "snapshotContent" FROM ${databaseNameAsId}.${snapshotsTableNameAsId}
    WHERE "snapshotKey" = ${escape(snapshotKey)} 
    LIMIT 1`
  )
  const content = rows.length > 0 ? rows[0].snapshotContent : null

  return content
}

export default loadSnapshot
