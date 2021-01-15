import getLog from './get-log'
import { AdapterPool, AdapterSpecific } from './types'

const connect = async (
  pool: AdapterPool,
  specific: AdapterSpecific
): Promise<any> => {
  const log = getLog('connect')
  log.debug('connecting to mysql databases')

  const { MySQL, escapeId, escape }: AdapterSpecific = specific

  Object.assign(pool, {
    escapeId,
    escape,
  })

  let {
    eventsTableName,
    snapshotsTableName,
    secretsTableName,
    database,
    // eslint-disable-next-line prefer-const
    ...connectionOptions
  } = pool.config

  eventsTableName = pool.coerceEmptyString(eventsTableName, 'events')
  snapshotsTableName = pool.coerceEmptyString(snapshotsTableName, 'snapshots')
  secretsTableName = pool.coerceEmptyString(secretsTableName, 'default')
  database = pool.coerceEmptyString(database)

  log.debug(`establishing connection`)

  const connection: any = await MySQL.createConnection({
    ...connectionOptions,
    database,
    multipleStatements: true,
  })

  const [[{ version }]] = await connection.query(
    `SELECT version() AS \`version\``
  )
  const major: number = +version.split('.')[0]
  if (isNaN(major) || major < 8) {
    throw new Error(`Supported MySQL version 8+, but got ${version}`)
  }

  log.debug(`connected successfully`)

  Object.assign(pool, {
    connection,
    eventsTableName,
    snapshotsTableName,
    secretsTableName,
    database,
  })

  log.debug('mysql databases are connected')
}

export default connect
