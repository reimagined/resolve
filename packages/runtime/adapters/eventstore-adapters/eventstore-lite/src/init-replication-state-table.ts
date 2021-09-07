import { AdapterPool } from './types'
import { ReplicationStatus } from '@resolve-js/eventstore-base'

const initReplicationStateTable = async (
  pool: AdapterPool
): Promise<string> => {
  const { eventsTableName, executeQuery, escapeId, escape } = pool

  const replicationStateTableName = `${eventsTableName}-replication-state`
  const replicationStateTableNameAsId = escapeId(replicationStateTableName)

  const notStarted: ReplicationStatus = 'notStarted'
  await executeQuery(`BEGIN IMMEDIATE;
      CREATE TABLE IF NOT EXISTS ${replicationStateTableNameAsId}(
        "id" TINYINT DEFAULT 0 PRIMARY KEY CHECK (id = 0),
        "Status" VARCHAR(50) DEFAULT ${escape(notStarted)},
        "StatusData" JSON NULL,
        "Iterator" JSON NULL,
        "IsPaused" TINYINT DEFAULT 0 NOT NULL,
        "SuccessEvent" JSON NULL
      );
      INSERT OR IGNORE INTO ${replicationStateTableNameAsId} DEFAULT VALUES;
      COMMIT;
    `)

  return replicationStateTableName
}

export default initReplicationStateTable
