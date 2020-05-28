import getLog from './js/get-log'
import { AdapterPool, AdapterSpecific } from './types'

const connect = async (
  pool: AdapterPool,
  specific: AdapterSpecific
): Promise<any> => {
  const log = getLog('connect')
  log.debug('configuring RDS data service client')

  const {
    RDSDataService,
    escapeId,
    escape,
    fullJitter,
    executeStatement,
    coercer
  } = specific

  const {
    dbClusterOrInstanceArn,
    awsSecretStoreArn,
    databaseName,
    tableName,
    secretsTableName,
    ...rdsConfig
  } = pool.config ?? {}

  const rdsDataService = new RDSDataService(rdsConfig)

  Object.assign(pool, {
    rdsDataService,
    dbClusterOrInstanceArn,
    awsSecretStoreArn,
    databaseName,
    tableName,
    secretsTableName,
    fullJitter,
    coercer,
    executeStatement: executeStatement.bind(null, pool),
    escapeId,
    escape
  })

  log.debug('RDS data service client configured')
}

export default connect
