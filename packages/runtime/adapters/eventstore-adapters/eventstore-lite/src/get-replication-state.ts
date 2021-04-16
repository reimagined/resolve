import { AdapterPool } from './types'
import {
  ReplicationState,
  ReplicationStatus,
  getInitialReplicationState,
} from '@resolve-js/eventstore-base'
import initReplicationStateTable from './init-replication-state-table'

const getReplicationState = async (
  pool: AdapterPool
): Promise<ReplicationState> => {
  const { database, escapeId } = pool

  const replicationStateTableName = await initReplicationStateTable(pool)

  const rows = await database.all(
    `SELECT Status, StatusData, Iterator, IsPaused FROM ${escapeId(
      replicationStateTableName
    )}`
  )
  if (rows.length > 0) {
    const row = rows[0]
    return {
      status: row.Status as ReplicationStatus,
      statusData: row.StatusData != null ? JSON.parse(row.StatusData) : null,
      paused: row.IsPaused !== 0,
      iterator: row.Iterator != null ? JSON.parse(row.Iterator) : null,
    }
  } else {
    return getInitialReplicationState()
  }
}

export default getReplicationState
