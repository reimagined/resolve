import getLog from './get-log'
import { AdapterPool, AdapterSpecific } from './types'

const connect = async (
  pool: AdapterPool,
  specific: AdapterSpecific
): Promise<any> => {
  const log = getLog('connect')
  log.debug('configuring postgres client')

  const {
    Postgres,
    escapeId,
    escape,
    fullJitter,
    executeStatement,
    coercer,
  } = specific

  let {
    databaseName,
    eventsTableName,
    snapshotsTableName,
    secretsTableName,
    // eslint-disable-next-line prefer-const
    ...connectionOptions
  } = pool.config

  eventsTableName = pool.coerceEmptyString(eventsTableName, 'events')
  snapshotsTableName = pool.coerceEmptyString(snapshotsTableName, 'snapshots')
  secretsTableName = pool.coerceEmptyString(secretsTableName, 'default')
  databaseName = pool.coerceEmptyString(databaseName)

  Object.assign(pool, {
    databaseName,
    eventsTableName,
    snapshotsTableName,
    secretsTableName,
    connectionOptions,
    Postgres,
    fullJitter,
    coercer,
    executeStatement: executeStatement.bind(null, pool),
    escapeId,
    escape,
  })

  if (pool.executeStatement != null) {
    await pool.executeStatement('SELECT 0 AS "defunct"')
  }
  log.debug('connection to postgres databases established')
}

export default connect
