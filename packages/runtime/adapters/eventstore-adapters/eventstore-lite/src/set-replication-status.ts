import { AdapterPool } from './types'
import {
  ReplicationStatus,
  ReplicationState,
} from '@resolve-js/eventstore-base'
import initReplicationStateTable from './init-replication-state-table'

const setReplicationStatus = async (
  pool: AdapterPool,
  status: ReplicationStatus,
  statusData?: ReplicationState['statusData']
): Promise<void> => {
  const { database, escapeId, escape } = pool

  const replicationStateTableName = await initReplicationStateTable(pool)

  await database.exec(
    `UPDATE ${escapeId(replicationStateTableName)} 
    SET
      Status = ${escape(status)},
      StatusData = ${escape(
        statusData != null ? JSON.stringify(statusData) : 'null'
      )}`
  )
}

export default setReplicationStatus
