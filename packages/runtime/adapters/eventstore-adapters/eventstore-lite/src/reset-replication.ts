import type { AdapterPool } from './types'
import type { ReplicationState } from '@resolve-js/eventstore-base'
import initReplicationStateTable from './init-replication-state-table'

const resetReplication = async (pool: AdapterPool): Promise<void> => {
  const {
    executeQuery,
    eventsTableName,
    secretsTableName,
    escapeId,
    escape,
  } = pool
  const eventsTableNameAsId = escapeId(eventsTableName)
  const secretsTableNameAsId = escapeId(secretsTableName)
  const replicationStateTableName = await initReplicationStateTable(pool)
  const replicationStateTableNameAsId = escapeId(replicationStateTableName)

  const notStarted: ReplicationState['statusAndData']['status'] = 'notStarted'

  await executeQuery(`
    BEGIN IMMEDIATE;
    DELETE FROM ${eventsTableNameAsId};
    DELETE FROM ${secretsTableNameAsId};
    UPDATE ${replicationStateTableNameAsId} SET
      "Status" = ${escape(notStarted)},
      "StatusData" = NULL,
      "Iterator" = NULL,
      "SuccessEvent" = NULL,
      "LockExpirationTime" = 0,
      "LockId" = NULL;
    COMMIT;`)
}

export default resetReplication
