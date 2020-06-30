import getLog from './js/get-log'
import dropEventStore from './js/drop'
import { AdapterPool } from './types'

const dropSecretsStore = async (pool: AdapterPool): Promise<any> => {
  const log = getLog('dropSecretsStore')

  log.debug(`dropping secrets store database tables`)
  const {
    secrets: { tableName, connection },
    escapeId
  } = pool
  log.verbose(`secretsTableName: ${tableName}`)

  await connection.execute(`DROP TABLE IF EXISTS ${escapeId(tableName)}`)

  log.debug(`secrets store database tables are dropped`)
}

const drop = async (pool: AdapterPool): Promise<any> => {
  const log = getLog('drop')

  log.debug(`dropping the event store`)
  await Promise.all([dropEventStore(pool), dropSecretsStore(pool)])
  log.debug(`the event store dropped`)
}

export default drop
