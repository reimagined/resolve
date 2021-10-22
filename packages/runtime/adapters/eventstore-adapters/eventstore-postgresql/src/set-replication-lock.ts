import { AdapterPool } from './types'
import initReplicationStateTable from './init-replication-state-table'
import { LONG_NUMBER_SQL_TYPE } from './constants'

const setReplicationLock = async (
  pool: AdapterPool,
  lockDuration: number
): Promise<boolean> => {
  const { executeStatement, escapeId, databaseName } = pool

  const replicationStateTableName = await initReplicationStateTable(pool)
  const databaseNameAsId = escapeId(databaseName)

  if (lockDuration <= 0) {
    await executeStatement(
      `UPDATE ${databaseNameAsId}.${escapeId(replicationStateTableName)} 
    SET "LockExpirationTime" = 0`
    )
    return true
  } else {
    const rows = await executeStatement(
      `UPDATE ${databaseNameAsId}.${escapeId(replicationStateTableName)} 
    SET "LockExpirationTime" = CAST(extract(epoch from clock_timestamp()) * 1000 AS ${LONG_NUMBER_SQL_TYPE}) + ${+lockDuration}
    WHERE "LockExpirationTime" < CAST(extract(epoch from clock_timestamp()) * 1000 AS ${LONG_NUMBER_SQL_TYPE}) RETURNING "LockExpirationTime"`
    )
    return rows.length !== 0
  }
}

export default setReplicationLock
