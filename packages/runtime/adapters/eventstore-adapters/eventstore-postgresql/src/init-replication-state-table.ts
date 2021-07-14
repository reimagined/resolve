import type { AdapterPool } from './types'
import type { ReplicationStatus } from '@resolve-js/eventstore-base'
import { getLog } from './get-log'

const initReplicationStateTable = async (
  pool: AdapterPool
): Promise<string> => {
  const log = getLog('initReplicationStateTable')

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

  let tries = 0
  const maxTries = 5
  while (tries < maxTries) {
    try {
      await executeStatement(`CREATE TABLE IF NOT EXISTS ${databaseNameAsId}.${replicationStateTableNameAsId}(
        "id" SMALLINT DEFAULT 0 PRIMARY KEY CONSTRAINT singleton_row CHECK (id = 0),
        "Status" VARCHAR(50) DEFAULT ${escape(notStarted)},
        "StatusData" JSONB NULL,
        "Iterator" JSONB NULL,
        "IsPaused" BOOLEAN DEFAULT FALSE NOT NULL,
        "SuccessEvent" JSON NULL
      )
    `)
      break
    } catch (error) {
      tries++
      log.error(error)
      if (tries >= maxTries) {
        throw error
      }
    }
  }

  await executeStatement(
    `INSERT INTO ${databaseNameAsId}.${replicationStateTableNameAsId} DEFAULT VALUES ON CONFLICT ("id") DO NOTHING`
  )

  return replicationStateTableName
}

export default initReplicationStateTable
