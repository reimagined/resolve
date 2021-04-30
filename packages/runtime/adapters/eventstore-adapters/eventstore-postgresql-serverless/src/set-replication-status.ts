import { AdapterPool } from './types'
import {
  ReplicationStatus,
  ReplicationState,
  ReplicationAlreadyInProgress,
  OldEvent,
} from '@resolve-js/eventstore-base'
import initReplicationStateTable from './init-replication-state-table'

const setReplicationStatus = async (
  pool: AdapterPool,
  status: ReplicationStatus,
  statusData?: ReplicationState['statusData'],
  lastEvent?: OldEvent
): Promise<void> => {
  const { executeStatement, escapeId, escape, databaseName } = pool

  const replicationStateTableName = await initReplicationStateTable(pool)
  const databaseNameAsId = escapeId(databaseName)

  const batchInProgress: ReplicationStatus = 'batchInProgress'

  const rows = await executeStatement(
    `UPDATE ${databaseNameAsId}.${escapeId(replicationStateTableName)} 
    SET
      "Status" = ${escape(status)},
      "StatusData" = ${
        statusData != null ? escape(JSON.stringify(statusData)) : 'NULL'
      }
      ${
        lastEvent != null
          ? `, "SuccessEvent" = ${escape(JSON.stringify(lastEvent))}`
          : ``
      } ${
      status === batchInProgress
        ? `WHERE "Status" != ${escape(batchInProgress)}`
        : ``
    } RETURNING "Status"`
  )
  if (rows.length !== 1) {
    throw new ReplicationAlreadyInProgress()
  }
}

export default setReplicationStatus
