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
  const { database, escapeId, escape } = pool

  const replicationStateTableName = await initReplicationStateTable(pool)

  const batchInProgress: ReplicationStatus = 'batchInProgress'

  try {
    await database.exec(
      `
    ${
      status === batchInProgress
        ? `WITH "AlreadyInProgressCheck" AS (SELECT ABS("AlreadyInProcess") AS "AlreadyInProcess" FROM (
      SELECT 0 AS "AlreadyInProcess"
    UNION ALL
      SELECT -9223372036854775808 AS "AlreadyInProcess"
      FROM ${escapeId(replicationStateTableName)}
      WHERE "Status" = ${escape(batchInProgress)}
    ))`
        : ``
    }
    UPDATE ${escapeId(replicationStateTableName)} 
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
          ? `WHERE (SELECT COUNT("AlreadyInProcess") FROM "AlreadyInProgressCheck") = 1`
          : ``
      }`
    )
  } catch (error) {
    const errorMessage =
      error != null && error.message != null ? error.message : ''

    if (errorMessage === 'SQLITE_ERROR: integer overflow') {
      throw new ReplicationAlreadyInProgress()
    } else {
      throw error
    }
  }
}

export default setReplicationStatus
