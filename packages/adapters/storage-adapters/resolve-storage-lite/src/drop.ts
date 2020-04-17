import dropEventStore from './js/drop'
import { AdapterPool } from './types'

const dropSecretsStore = (pool: AdapterPool): Promise<any> => {
  const { secretsDatabase, secretsTableName } = pool
  return secretsDatabase.exec(`DROP TABLE IF EXISTS ${secretsTableName}`)
}

const drop = async (pool: AdapterPool): Promise<any> => {
  return Promise.all([dropEventStore(pool), dropSecretsStore(pool)])
}

export default drop
