import { AdapterPool } from './types'
import initReplicationStateTable from './init-replication-state-table'

const setReplicationLock = async (
  pool: AdapterPool,
  lockId: string,
  lockDuration: number
): Promise<boolean> => {
  const { executeStatement, escapeId } = pool

  const replicationStateTableName = await initReplicationStateTable(pool)

  if (lockDuration <= 0) {
    const rows = await executeStatement(
      `UPDATE ${escapeId(replicationStateTableName)} 
    SET
      "LockExpirationTime" = 0,
      "LockId" = NULL
    WHERE "LockId" = ${pool.escape(lockId)}
    RETURNING "LockExpirationTime", "LockId"`
    )
    return rows.length !== 0
  } else {
    const rows = await executeStatement(
      `UPDATE ${escapeId(replicationStateTableName)} 
    SET
      "LockExpirationTime" = CAST(strftime('%s','now') || substr(strftime('%f','now'),4) AS INTEGER) + ${+lockDuration},
      "LockId" = ${pool.escape(lockId)}
    WHERE "LockExpirationTime" < CAST(strftime('%s','now') || substr(strftime('%f','now'),4) AS INTEGER)
    RETURNING "LockExpirationTime"`
    )
    return rows.length !== 0
  }
}

export default setReplicationLock
