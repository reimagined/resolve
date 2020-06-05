import getLog from './get-log'

const DEFAULT_BUCKET_SIZE = 100

const connectEventStore = async (pool, { MySQL }) => {
  const log = getLog(`connectEventStore`)

  log.debug('connecting to events store database')

  const {
    eventsTableName = 'events',
    snapshotsTableName = 'snapshots',
    database,
    bucketSize,
    ...connectionOptions
  } = pool.config

  log.verbose(`eventsTableName: ${eventsTableName}`)
  log.verbose(`snapshotsTableName: ${snapshotsTableName}`)
  log.verbose(`database: ${database}`)

  log.debug(`establishing connection`)

  const connection = await MySQL.createConnection({
    ...connectionOptions,
    database,
    multipleStatements: true
  })

  log.debug(`connected successfully`)

  pool.bucketSize = bucketSize
  if (!Number.isInteger(pool.bucketSize) || pool.bucketSize < 1) {
    pool.bucketSize = DEFAULT_BUCKET_SIZE
  }

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
