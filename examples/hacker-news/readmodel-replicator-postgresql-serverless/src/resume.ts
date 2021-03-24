import type { ExternalMethods } from './types'

const resume: ExternalMethods['resume'] = async (pool, readModelName, next) => {
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
      sql: `DROP TABLE ${databaseNameAsId}.${pauseTableNameAsId}`,
    })
  } catch (error) {
    if (!/Table.*? does not exist$/i.test(error.message)) throw error
  }
  await next()
}

export default resume
