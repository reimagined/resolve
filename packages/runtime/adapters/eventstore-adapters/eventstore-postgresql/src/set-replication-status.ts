import type { AdapterPool } from './types'
import type { ReplicationState, OldEvent } from '@resolve-js/eventstore-base'
import { LONG_NUMBER_SQL_TYPE } from './constants'
import initReplicationStateTable from './init-replication-state-table'

const setReplicationStatus = async (
  pool: AdapterPool,
  lockId: string,
  {
    statusAndData,
    lastEvent,
    iterator,
  }: {
    statusAndData: ReplicationState['statusAndData']
    lastEvent?: OldEvent
    iterator?: ReplicationState['iterator']
  }
): Promise<ReplicationState | null> => {
  const { executeStatement, escapeId, escape, databaseName } = pool

  const replicationStateTableName = await initReplicationStateTable(pool)
  const databaseNameAsId = escapeId(databaseName)

  const rows = await executeStatement(
    `UPDATE ${databaseNameAsId}.${escapeId(replicationStateTableName)} 
    SET
      "Status" = ${escape(statusAndData.status)},
      "StatusData" = ${
        statusAndData.data != null
          ? escape(JSON.stringify(statusAndData.data))
          : 'NULL'
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
      }
      WHERE "LockId" = ${pool.escape(lockId)}
      RETURNING "Status", "StatusData", "Iterator", "IsPaused", "SuccessEvent", 
    ("LockExpirationTime" > (CAST(extract(epoch from clock_timestamp()) * 1000 AS ${LONG_NUMBER_SQL_TYPE}))) as "Locked", "LockId"`
  )
  if (rows.length === 1) {
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
      lockId: row.LockId,
    }
  } else {
    return null
  }
}

export default setReplicationStatus
