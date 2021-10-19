import type { AdapterPool } from './types'
import type { ReplicationStatus } from '@resolve-js/eventstore-base'
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

  const notStarted: ReplicationStatus = 'notStarted'

  await executeQuery(`
    BEGIN IMMEDIATE;
    DELETE FROM ${eventsTableNameAsId};
    DELETE FROM ${secretsTableNameAsId};
    UPDATE ${replicationStateTableNameAsId} SET
      "Status" = ${escape(notStarted)},
      "StatusData" = NULL,
      "Iterator" = NULL,
      "SuccessEvent" = NULL;
    COMMIT;`)
}

export default resetReplication
