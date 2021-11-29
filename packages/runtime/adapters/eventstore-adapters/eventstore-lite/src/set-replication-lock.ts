import { AdapterPool } from './types'
import initReplicationStateTable from './init-replication-state-table'

const setReplicationLock = async (
  pool: AdapterPool,
  lockDuration: number
): Promise<boolean> => {
  const { executeStatement, executeQuery, escapeId } = pool

  const replicationStateTableName = await initReplicationStateTable(pool)

  if (lockDuration <= 0) {
    await executeQuery(
      `UPDATE ${escapeId(replicationStateTableName)} 
    SET "LockExpirationTime" = 0`
    )
    return true
  } else {
    const rows = await executeStatement(
      `UPDATE ${escapeId(replicationStateTableName)} 
    SET "LockExpirationTime" = CAST(strftime('%s','now') || substr(strftime('%f','now'),4) AS INTEGER) + ${+lockDuration}
    WHERE "LockExpirationTime" < CAST(strftime('%s','now') || substr(strftime('%f','now'),4) AS INTEGER) RETURNING "LockExpirationTime"`
    )
    return rows.length !== 0
  }
}

export default setReplicationLock
