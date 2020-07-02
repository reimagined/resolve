import getLog from './get-log'

const connectEventStore = async (pool, { MySQL }) => {
  const log = getLog(`connectEventStore`)

  log.debug('connecting to events store database')

  const {
    eventsTableName = 'events',
    snapshotsTableName = 'snapshots',
    database,
    ...connectionOptions
  } = pool.config

  log.verbose(`eventsTableName: ${eventsTableName}`)
  log.verbose(`snapshotsTableName: ${snapshotsTableName}`)
  log.verbose(`database: ${database}`)

  log.debug(`establishing connection`)

  // MySQL throws warning
  delete connectionOptions.snapshotBucketSize

  const connection = await MySQL.createConnection({
    ...connectionOptions,
    database,
    multipleStatements: true
  })

  log.debug(`connected successfully`)

  Object.assign(pool, {
    events: {
      connection,
      eventsTableName,
      snapshotsTableName,
      database
    }
  })
}

export default connectEventStore
