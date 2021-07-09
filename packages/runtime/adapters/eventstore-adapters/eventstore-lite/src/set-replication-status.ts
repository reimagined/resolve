import type { AdapterPool } from './types'
import type {
  ReplicationStatus,
  ReplicationState,
  OldEvent,
} from '@resolve-js/eventstore-base'
import initReplicationStateTable from './init-replication-state-table'

const setReplicationStatus = async (
  pool: AdapterPool,
  status: ReplicationStatus,
  statusData?: ReplicationState['statusData'],
  lastEvent?: OldEvent
): Promise<void> => {
  const { database, escapeId, escape } = pool

  const replicationStateTableName = await initReplicationStateTable(pool)

  await database.exec(
    `UPDATE ${escapeId(replicationStateTableName)} 
    SET
    "Status" = ${escape(status)},
    "StatusData" = ${
      statusData != null ? escape(JSON.stringify(statusData)) : 'NULL'
    }
    ${
      lastEvent != null
        ? `, "SuccessEvent" = ${escape(JSON.stringify(lastEvent))}`
        : ``
    }`
  )
}

export default setReplicationStatus
