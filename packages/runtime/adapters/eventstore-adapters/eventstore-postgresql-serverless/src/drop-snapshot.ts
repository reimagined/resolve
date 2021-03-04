import { AdapterPool } from './types'

const dropSnapshot = async (
  {
    databaseName,
    snapshotsTableName,
    executeStatement,
    escapeId,
    escape,
  }: AdapterPool,
  snapshotKey: string
): Promise<void> => {
  const databaseNameAsId = escapeId(databaseName)
  const snapshotsTableNameAsId = escapeId(snapshotsTableName)

  await executeStatement(
    `DELETE FROM ${databaseNameAsId}.${snapshotsTableNameAsId}
    WHERE "snapshotKey" LIKE ${escape(`${snapshotKey}%`)}`
  )
}

export default dropSnapshot
