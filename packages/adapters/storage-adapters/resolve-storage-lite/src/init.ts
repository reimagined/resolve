import getLog from 'resolve-debug-levels'
import initEventStore from './js/init'
import logNamespace from './log-namespace'
import { AdapterPool } from './types'

const initSecretsStore = (pool: AdapterPool): Promise<any> => {
  const { secretsDatabase, secretsTableName, escapeId } = pool
  return secretsDatabase.exec(`CREATE TABLE IF NOT EXISTS ${escapeId(
    secretsTableName
  )} (
        ${escapeId('idx')} BIG INT NOT NULL,
        ${escapeId('id')} uuid NOT NULL,
        ${escapeId('text')} text,
        PRIMARY KEY(${escapeId('id')}, ${escapeId('idx')})
      )`)
}

const init = async (pool: AdapterPool): Promise<any> => {
  const log = getLog(logNamespace('init'))
  log.debug('initializing databases')
  const result = await Promise.all([
    initEventStore(pool),
    initSecretsStore(pool)
  ])
  log.debug('databases are initialized')
  return result
}

export default init
