import getLog from './js/get-log'
import connectEventStore from './js/connect'
import { AdapterPool, AdapterSpecific } from './types'

const connectSecretsStore = async (
  pool: AdapterPool,
  specific: AdapterSpecific
): Promise<void> => {
  const log = getLog('connectSecretsStore')

  log.debug('connecting to secrets store database')

  const { MySQL } = specific
  const {
    eventsTableName,
    snapshotsTableName,
    secretsTableName = 'secrets',
    secretsDatabase,
    database,
    ...connectionOptions
  } = pool.config

  // MySQL throws warning
  delete connectionOptions.snapshotBucketSize

  const actualDatabase = secretsDatabase || database

  log.verbose(`secretsDatabase: ${actualDatabase}`)
  log.verbose(`secretsTableName: ${secretsTableName}`)

  log.debug(`establishing connection`)

  const connection = await MySQL.createConnection({
    ...connectionOptions,
    database: secretsDatabase || database,
    multipleStatements: true,
  })

  log.debug(`connected successfully`)

  Object.assign(pool, {
    secrets: {
      connection,
      tableName: secretsTableName,
      database: actualDatabase,
    },
  })
}

const connect = async (
  pool: AdapterPool,
  specific: AdapterSpecific
): Promise<any> => {
  const log = getLog('connect')
  log.debug('connecting to mysql databases')

  const { escapeId, escape } = specific

  Object.assign(pool, {
    escapeId,
    escape,
  })

  await Promise.all([
    connectEventStore(pool, specific),
    connectSecretsStore(pool, specific),
  ])
  log.debug('mysql databases are connected')
}

export default connect
