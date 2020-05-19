import getLog from './js/get-log'
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
    coercer
  } = specific

  Object.assign(pool, {
    databaseName: pool.config.databaseName,
    tableName: pool.config.tableName,
    secretsTableName: pool.config.secretsTableName,
    Postgres,
    fullJitter,
    coercer,
    executeStatement: executeStatement.bind(null, pool),
    escapeId,
    escape
  })

  if (pool.executeStatement != null) {
    await pool.executeStatement('SELECT 0 AS "defunct"')
  }
  log.debug('connection to postgres databases established')
}

export default connect
