import type { AdapterPool } from './types'
import type {
  ReplicationStatus,
  ReplicationState,
  OldEvent,
} from '@resolve-js/eventstore-base'
import initReplicationStateTable from './init-replication-state-table'

const setReplicationStatus = async (
  pool: AdapterPool,
  {
    status,
    statusData,
    lastEvent,
    iterator,
  }: {
    status: ReplicationStatus
    statusData?: ReplicationState['statusData']
    lastEvent?: OldEvent
    iterator?: ReplicationState['iterator']
  }
): Promise<void> => {
  const { executeQuery, escapeId, escape } = pool

  const replicationStateTableName = await initReplicationStateTable(pool)

  await executeQuery(
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
      }
      ${
        iterator !== undefined
          ? `, "Iterator" = ${
              iterator != null ? escape(JSON.stringify(iterator)) : 'NULL'
            }`
          : ``
      }`
  )
}

export default setReplicationStatus
