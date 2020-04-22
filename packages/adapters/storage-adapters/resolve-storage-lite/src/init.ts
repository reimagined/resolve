import initEventStore from './js/init'
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
  return Promise.all([initEventStore(pool), initSecretsStore(pool)])
}

export default init
