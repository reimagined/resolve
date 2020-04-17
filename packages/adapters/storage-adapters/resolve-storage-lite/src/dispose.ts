import disposeEventStore from './js/drop'
import { AdapterPool } from './types'

const disposeSecretsStore = (pool: AdapterPool): Promise<any> => {
  const { secretsDatabase } = pool
  return secretsDatabase.close()
}

const dispose = async (pool: AdapterPool): Promise<any> => {
  return Promise.all([disposeEventStore(pool), disposeSecretsStore(pool)])
}

export default dispose
