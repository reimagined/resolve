import { getLog } from './get-log'
import type {
  ConnectionDependencies,
  MysqlAdapterPoolConnectedProps,
  AdapterPoolPrimal,
  MysqlAdapterConfig,
} from './types'

const connect = async (
  pool: AdapterPoolPrimal,
  { MySQL, escapeId, escape }: ConnectionDependencies,
  config: MysqlAdapterConfig
): Promise<void> => {
  const log = getLog('connect')
  log.debug('connecting to mysql databases')

  Object.assign(pool, {
    escapeId,
    escape,
  })

  let {
    eventsTableName,
    snapshotsTableName,
    secretsTableName,
    subscribersTableName,
    database,
    // eslint-disable-next-line prefer-const
    ...connectionOptions
  } = config

  eventsTableName = eventsTableName ?? 'events'
  snapshotsTableName = snapshotsTableName ?? 'snapshots'
  secretsTableName = secretsTableName ?? 'secrets'
  subscribersTableName = subscribersTableName ?? 'subscribers'

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

  Object.assign<AdapterPoolPrimal, Partial<MysqlAdapterPoolConnectedProps>>(
    pool,
    {
      connection,
      eventsTableName,
      snapshotsTableName,
      secretsTableName,
      subscribersTableName,
      database,
    }
  )

  log.debug('mysql databases are connected')
}

export default connect
