import initEventStore from './js/init'
import { AdapterPool } from './types'

const initSecretsStore = (pool: AdapterPool): Promise<any> => {
  const { secretsDatabase, secretsTableName } = pool
  return secretsDatabase.exec(`CREATE TABLE IF NOT EXISTS ${secretsTableName} (
        idx BIG INT NOT NULL,
        id uuid NOT NULL,
        key text,
        PRIMARY KEY(id, idx)
      )`)
}

const initAll = async (pool: AdapterPool): Promise<any> => {
  return Promise.all([initEventStore(pool), initSecretsStore(pool)])
}

export default initAll
