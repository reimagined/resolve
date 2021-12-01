import type { AdapterPool } from './types'
import type { ReplicationState, OldEvent } from '@resolve-js/eventstore-base'
import { getInitialReplicationState } from '@resolve-js/eventstore-base'
import initReplicationStateTable from './init-replication-state-table'

const getReplicationState = async (
  pool: AdapterPool
): Promise<ReplicationState> => {
  const { executeStatement, escapeId } = pool

  const replicationStateTableName = await initReplicationStateTable(pool)

  const rows = await executeStatement(
    `SELECT "Status", "StatusData", "Iterator", "IsPaused", "SuccessEvent", 
     ("LockExpirationTime" > CAST(strftime('%s','now') || substr(strftime('%f','now'),4) AS INTEGER)) as "Locked" FROM ${escapeId(
       replicationStateTableName
     )}`
  )
  if (rows.length > 0) {
    const row = rows[0]

    let lastEvent: OldEvent | null = null
    if (row.SuccessEvent != null) {
      lastEvent = JSON.parse(row.SuccessEvent) as OldEvent
    }

    return {
      statusAndData: {
        status: row.Status,
        data: row.StatusData != null ? JSON.parse(row.StatusData) : null,
      } as ReplicationState['statusAndData'],
      paused: row.IsPaused !== 0,
      iterator: row.Iterator != null ? JSON.parse(row.Iterator) : null,
      successEvent: lastEvent,
      locked: !!row.Locked,
    }
  } else {
    return getInitialReplicationState()
  }
}

export default getReplicationState
