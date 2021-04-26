import { AdapterPool } from './types'
import initReplicationStateTable from './init-replication-state-table'

const setReplicationPaused = async (
  pool: AdapterPool,
  pause: boolean
): Promise<void> => {
  const { executeStatement, escapeId } = pool

  const replicationStateTableName = await initReplicationStateTable(pool)

  await executeStatement(
    `UPDATE ${escapeId(replicationStateTableName)} 
    SET "IsPaused" = ${pause ? `TRUE` : 'FALSE'}`
  )
}

export default setReplicationPaused
