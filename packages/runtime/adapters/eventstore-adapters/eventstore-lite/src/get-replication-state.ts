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
  const { database, escapeId } = pool

  const replicationStateTableName = await initReplicationStateTable(pool)

  const rows = await database.all(
    `SELECT Status, StatusData, Iterator, IsPaused, SuccessEvent FROM ${escapeId(
      replicationStateTableName
    )}`
  )
  if (rows.length > 0) {
    const row = rows[0]

    let lastEvent: OldEvent
    if (row.SuccessEvent != null) {
      lastEvent = JSON.parse(row.SuccessEvent) as OldEvent
    } else {
      lastEvent = {
        type: 'Init',
      } as OldEvent
    }

    return {
      status: row.Status as ReplicationStatus,
      statusData: row.StatusData != null ? JSON.parse(row.StatusData) : null,
      paused: row.IsPaused !== 0,
      iterator: row.Iterator != null ? JSON.parse(row.Iterator) : null,
      successEvent: lastEvent,
    }
  } else {
    return getInitialReplicationState()
  }
}

export default getReplicationState
