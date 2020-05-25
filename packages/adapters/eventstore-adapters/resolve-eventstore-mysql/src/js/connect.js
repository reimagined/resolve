import getLog from './get-log'

const connectEventStore = async (pool, { MySQL }) => {
  const log = getLog(`connectEventStore`)

  log.debug('connecting to events store database')

  const { tableName = 'default', database, ...connectionOptions } = pool.config

  log.verbose(`tableName: ${tableName}`)
  log.verbose(`database: ${database}`)

  log.debug(`establishing connection`)

  const connection = await MySQL.createConnection({
    ...connectionOptions,
    database,
    multipleStatements: true
  })

  log.debug(`connected successfully`)

  Object.assign(pool, {
    events: {
      connection,
      tableName,
      database
    }
  })
}

export default connectEventStore
