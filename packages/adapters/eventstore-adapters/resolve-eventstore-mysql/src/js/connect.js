import getLog from './get-log'

const connectEventStore = async (pool, { MySQL }) => {
  const log = getLog(`connectEventStore`)

  log.debug('connecting to events store database')

  const {
    eventsTableName = 'events',
    snapshotsTableName = 'snapshots',
    secretsTableName,
    snapshotBucketSize,
    database,
    ...connectionOptions
  } = pool.config

  log.verbose(`eventsTableName: ${eventsTableName}`)
  log.verbose(`snapshotsTableName: ${snapshotsTableName}`)
  log.verbose(`database: ${database}`)

  log.debug(`establishing connection`)

  void (secretsTableName, snapshotBucketSize)

  const connection = await MySQL.createConnection({
    ...connectionOptions,
    database,
    multipleStatements: true
  })

  const [[{ version }]] = await connection.query(
    `SELECT version() AS \`version\``
  )
  const major = +version.split('.')[0]
  if (isNaN(major) || major < 8) {
    throw new Error(`Supported MySQL version 8+, but got ${version}`)
  }

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
