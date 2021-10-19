import type { AdapterPool } from './types'
import initReplicationStateTable from './init-replication-state-table'

const setReplicationPaused = async (
  pool: AdapterPool,
  pause: boolean
): Promise<void> => {
  const { executeStatement, escapeId, databaseName } = pool

  const replicationStateTableName = await initReplicationStateTable(pool)
  const databaseNameAsId = escapeId(databaseName)

  await executeStatement(
    `UPDATE ${databaseNameAsId}.${escapeId(replicationStateTableName)} 
    SET "IsPaused" = ${pause ? `TRUE` : 'FALSE'}`
  )
}

export default setReplicationPaused
