import { AdapterPool } from './types'
import {
  ReplicationState,
  ReplicationStatus,
  getInitialReplicationState,
  OldEvent,
} from '@resolve-js/eventstore-base'
import initReplicationStateTable from './init-replication-state-table'

const getReplicationState = async (
  pool: AdapterPool
): Promise<ReplicationState> => {
  const { executeStatement, escapeId, databaseName } = pool

  const replicationStateTableName = await initReplicationStateTable(pool)
  const databaseNameAsId = escapeId(databaseName)

  const rows = (await executeStatement(
    `SELECT "Status", "StatusData", "Iterator", "IsPaused", "SuccessEvent" FROM ${databaseNameAsId}.${escapeId(
      replicationStateTableName
    )}`
  )) as Array<{
    Status: string
    StatusData: ReplicationState['statusData']
    Iterator: ReplicationState['statusData']
    IsPaused: boolean
    SuccessEvent: ReplicationState['statusData']
  }>
  if (rows.length > 0) {
    const row = rows[0]

    let lastEvent: OldEvent | null = null
    if (row.SuccessEvent != null) {
      lastEvent = row.SuccessEvent as OldEvent
    }

    return {
      status: row.Status as ReplicationStatus,
      statusData: row.StatusData,
      paused: row.IsPaused,
      iterator: row.Iterator,
      successEvent: lastEvent,
    }
  } else {
    return getInitialReplicationState()
  }
}

export default getReplicationState
