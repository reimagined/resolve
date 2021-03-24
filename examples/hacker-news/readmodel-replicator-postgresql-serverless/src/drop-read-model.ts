import type { DropReadModelMethod } from './types'
import escapeId from './escape-id'

const dropReadModel: DropReadModelMethod = async (pool, readModelName) => {
  const {
    targetEventStore,
    rdsDataService,
    dbClusterOrInstanceArn,
    awsSecretStoreArn,
  } = pool

  const {
    dbClusterOrInstanceArn: eventStoreClusterArn = dbClusterOrInstanceArn,
    awsSecretStoreArn: eventStoreSecretArn = awsSecretStoreArn,
    databaseName: eventStoreDatabaseName,
    eventsTableName: eventStoreEventsTableName = 'events',
  } = targetEventStore

  const eventStoreDatabaseNameAsId = escapeId(eventStoreDatabaseName)
  const eventStoreEventsTableAsId = escapeId(eventStoreEventsTableName)
  const eventStoreThreadsTableAsId = escapeId(
    `${eventStoreEventsTableName}-threads`
  )

  const statements = [
    `TRUNCATE ${eventStoreDatabaseNameAsId}.${eventStoreEventsTableAsId}`,
    `TRUNCATE ${eventStoreDatabaseNameAsId}.${eventStoreThreadsTableAsId}`,
    `INSERT INTO ${eventStoreDatabaseNameAsId}.${eventStoreThreadsTableAsId}(
      "threadId",
      "threadCounter"
    ) VALUES ${Array.from(new Array(256))
      .map((_, index) => `(${index}, 0)`)
      .join(',')}`,
  ]

  for (const statement of statements) {
    await rdsDataService.executeStatement({
      resourceArn: eventStoreClusterArn,
      secretArn: eventStoreSecretArn,
      database: 'postgres',
      sql: statement,
    })
  }
}

export default dropReadModel
