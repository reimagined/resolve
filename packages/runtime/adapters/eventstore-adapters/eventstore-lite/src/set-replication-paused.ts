import type { AdapterPool } from './types'
import initReplicationStateTable from './init-replication-state-table'

const setReplicationPaused = async (
  pool: AdapterPool,
  pause: boolean
): Promise<void> => {
  const { executeQuery, escapeId } = pool

  const replicationStateTableName = await initReplicationStateTable(pool)

  await executeQuery(
    `UPDATE ${escapeId(replicationStateTableName)} 
    SET "IsPaused" = ${pause ? 1 : 0}`
  )
}

export default setReplicationPaused
