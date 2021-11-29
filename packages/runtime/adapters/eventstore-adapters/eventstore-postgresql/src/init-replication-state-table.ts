import type { AdapterPool } from './types'
import type { ReplicationStatus } from '@resolve-js/eventstore-base'
import { LONG_NUMBER_SQL_TYPE } from './constants'

const initReplicationStateTable = async (
  pool: AdapterPool
): Promise<string> => {
  const {
    eventsTableName,
    escapeId,
    escape,
    executeStatement,
    databaseName,
  } = pool

  const databaseNameAsId = escapeId(databaseName)
  const replicationStateTableName = `${eventsTableName}-replication-state`
  const replicationStateTableNameAsId = escapeId(replicationStateTableName)

  const notStarted: ReplicationStatus = 'notStarted'

  await executeStatement(`CREATE TABLE IF NOT EXISTS ${databaseNameAsId}.${replicationStateTableNameAsId}(
        "id" SMALLINT DEFAULT 0 PRIMARY KEY CONSTRAINT singleton_row CHECK (id = 0),
        "Status" VARCHAR(50) DEFAULT ${escape(notStarted)},
        "StatusData" JSONB NULL,
        "Iterator" JSONB NULL,
        "IsPaused" BOOLEAN DEFAULT FALSE NOT NULL,
        "SuccessEvent" JSON NULL,
        "LockExpirationTime" ${LONG_NUMBER_SQL_TYPE} DEFAULT 0 NOT NULL
      )
    `)

  await executeStatement(
    `INSERT INTO ${databaseNameAsId}.${replicationStateTableNameAsId} DEFAULT VALUES ON CONFLICT ("id") DO NOTHING`
  )

  return replicationStateTableName
}

export default initReplicationStateTable
