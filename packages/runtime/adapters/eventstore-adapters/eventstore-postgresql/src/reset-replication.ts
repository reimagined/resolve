import type { AdapterPool } from './types'
import type { ReplicationState } from '@resolve-js/eventstore-base'

const resetReplication = async (pool: AdapterPool): Promise<void> => {
  const {
    executeStatement,
    databaseName,
    eventsTableName,
    secretsTableName,
    escapeId,
    escape,
  } = pool
  const databaseNameAsId = escapeId(databaseName)
  const eventsTableNameAsId = escapeId(eventsTableName)
  const secretsTableNameAsId = escapeId(secretsTableName)
  const replicationStateTableName = `${eventsTableName}-replication-state`
  const replicationStateTableNameAsId = escapeId(replicationStateTableName)
  const threadsTableAsId = escapeId(`${eventsTableName}-threads`)

  const notStarted: ReplicationState['statusAndData']['status'] = 'notStarted'

  await executeStatement(`
  BEGIN WORK;
  LOCK ${databaseNameAsId}.${replicationStateTableNameAsId} IN ACCESS EXCLUSIVE MODE;
  TRUNCATE ${databaseNameAsId}.${eventsTableNameAsId};
  TRUNCATE ${databaseNameAsId}.${secretsTableNameAsId};
  UPDATE ${databaseNameAsId}.${threadsTableAsId} SET "threadCounter" = 0;
  UPDATE ${databaseNameAsId}.${replicationStateTableNameAsId} SET
      "Status" = ${escape(notStarted)},
      "StatusData" = NULL,
      "Iterator" = NULL,
      "SuccessEvent" = NULL,
      "LockExpirationTime" = 0,
      "LockId" = NULL;
  COMMIT WORK;`)
}

export default resetReplication
