import getLog from './js/get-log'
import dropEventStore from './js/drop'
import { AdapterPool } from './types'

const dropSecretsStore = async (pool: AdapterPool): Promise<any> => {
  const log = getLog('dropSecretsStore')

  log.debug(`dropping secrets store database tables`)
  const { secretsDatabase, secretsTableName, escapeId } = pool
  log.verbose(`secretsTableName: ${secretsTableName}`)

  await secretsDatabase.exec(
    `DROP TABLE IF EXISTS ${escapeId(secretsTableName)}`
  )

  log.debug(`secrets store database tables are dropped`)
}

const drop = async (pool: AdapterPool): Promise<any> => {
  const log = getLog('drop')

  log.debug(`dropping the event store`)
  await Promise.all([dropEventStore(pool), dropSecretsStore(pool)])
  log.debug(`the event store dropped`)
}

export default drop
