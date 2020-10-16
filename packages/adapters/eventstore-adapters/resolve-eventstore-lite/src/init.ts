import getLog from './js/get-log'
import initEventStore from './js/init'
import { AdapterPool } from './types'
import { AGGREGATE_ID_SQL_TYPE } from './js/constants'

const initSecretsStore = async (pool: AdapterPool): Promise<any> => {
  const { secretsDatabase, secretsTableName, escapeId } = pool
  const log = getLog('initSecretsStore')

  log.debug(`initializing secrets store database tables`)
  log.verbose(`secretsTableName: ${secretsTableName}`)
  await secretsDatabase.exec(`CREATE TABLE IF NOT EXISTS ${escapeId(
    secretsTableName
  )} (
        ${escapeId('idx')} BIG INT NOT NULL,
        ${escapeId('id')} ${AGGREGATE_ID_SQL_TYPE} NOT NULL,
        ${escapeId('secret')} text,
        PRIMARY KEY(${escapeId('id')}, ${escapeId('idx')})
      )`)
  log.debug(`secrets store database tables are initialized`)
}

const init = async (pool: AdapterPool): Promise<any> => {
  const log = getLog('init')
  log.debug('initializing databases')
  const result = await Promise.all([
    initEventStore(pool),
    initSecretsStore(pool),
  ])
  log.debug('databases are initialized')
  return result
}

export default init
