import dropEventStore from './js/drop'
import { AdapterPool } from './types'

const dropSecretsStore = (pool: AdapterPool): Promise<any> => {
  const { secretsDatabase, secretsTableName, escapeId } = pool
  return secretsDatabase.exec(
    `DROP TABLE IF EXISTS ${escapeId(secretsTableName)}`
  )
}

const drop = async (pool: AdapterPool): Promise<any> => {
  console.log('dropping storage')
  return Promise.all([dropEventStore(pool), dropSecretsStore(pool)])
}

export default drop
