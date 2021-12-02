import type { AdapterPool } from './types'
import type { ReplicationState, OldEvent } from '@resolve-js/eventstore-base'
import { LONG_NUMBER_SQL_TYPE } from './constants'
import { getInitialReplicationState } from '@resolve-js/eventstore-base'
import initReplicationStateTable from './init-replication-state-table'

const getReplicationState = async (
  pool: AdapterPool
): Promise<ReplicationState> => {
  const { executeStatement, escapeId, databaseName } = pool

  const replicationStateTableName = await initReplicationStateTable(pool)
  const databaseNameAsId = escapeId(databaseName)

  const rows = (await executeStatement(
    `SELECT "Status", "StatusData", "Iterator", "IsPaused", "SuccessEvent", 
    ("LockExpirationTime" > (CAST(extract(epoch from clock_timestamp()) * 1000 AS ${LONG_NUMBER_SQL_TYPE}))) as "Locked"
     FROM ${databaseNameAsId}.${escapeId(replicationStateTableName)}`
  )) as Array<{
    Status: ReplicationState['statusAndData']['status']
    StatusData: ReplicationState['statusAndData']['data']
    Iterator: ReplicationState['iterator']
    IsPaused: boolean
    SuccessEvent: ReplicationState['successEvent']
    Locked: boolean
  }>
  if (rows.length > 0) {
    const row = rows[0]

    let lastEvent: OldEvent | null = null
    if (row.SuccessEvent != null) {
      lastEvent = row.SuccessEvent as OldEvent
    }

    return {
      statusAndData: {
        status: row.Status,
        data: row.StatusData,
      } as ReplicationState['statusAndData'],
      paused: row.IsPaused,
      iterator: row.Iterator,
      successEvent: lastEvent,
      locked: row.Locked,
    }
  } else {
    return getInitialReplicationState()
  }
}

export default getReplicationState
