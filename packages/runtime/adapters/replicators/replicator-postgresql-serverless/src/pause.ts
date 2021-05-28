import type { ExternalMethods } from './types'

const pause: ExternalMethods['pause'] = async (pool, readModelName) => {
  const { escapeId, targetEventStore, rdsDataService } = pool

  const {
    dbClusterOrInstanceArn: eventStoreClusterArn,
    awsSecretStoreArn: eventStoreSecretArn,
    databaseName: eventStoreDatabaseName,
    eventsTableName: eventStoreEventsTableName = 'events',
  } = targetEventStore

  const databaseNameAsId = escapeId(eventStoreDatabaseName)
  const pauseTableNameAsId = escapeId(`${eventStoreEventsTableName}-pause`)

  try {
    await rdsDataService.executeStatement({
      resourceArn: eventStoreClusterArn,
      secretArn: eventStoreSecretArn,
      database: 'postgres',
      sql: `CREATE TABLE ${databaseNameAsId}.${pauseTableNameAsId} (
      "surrogate" BIGINT NOT NULL,
      PRIMARY KEY("surrogate")
    );
    COMMENT ON TABLE ${databaseNameAsId}.${pauseTableNameAsId}
    IS 'RESOLVE EVENT STORE ${pauseTableNameAsId} PAUSE MARKER';
    `,
    })
  } catch (error) {
    if (
      /Relation.*? already exists$/i.test(error.message) ||
      /duplicate key value violates unique constraint/i.test(error.message)
    )
      return
    else throw error
  }
}

export default pause
