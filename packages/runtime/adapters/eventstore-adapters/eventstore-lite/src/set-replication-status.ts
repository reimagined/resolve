import type { AdapterPool } from './types'
import type { ReplicationState, OldEvent } from '@resolve-js/eventstore-base'
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
  const { executeStatement, escapeId, escape } = pool

  const replicationStateTableName = await initReplicationStateTable(pool)

  const rows = await executeStatement(
    `UPDATE ${escapeId(replicationStateTableName)} 
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
      WHERE "LockId" = ${escape(lockId)}
      RETURNING "Status", "StatusData", "Iterator", "IsPaused", "SuccessEvent", 
     ("LockExpirationTime" > CAST(strftime('%s','now') || substr(strftime('%f','now'),4) AS INTEGER)) as "Locked", "LockId"`
  )

  if (rows.length === 1) {
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
      lockId: row.lockId,
    }
  } else {
    return null
  }
}

export default setReplicationStatus
