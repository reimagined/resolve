import disposeEventStore from './js/drop'
import { AdapterPool } from './types'

const disposeSecretsStore = (pool: AdapterPool): Promise<any> => {
  const { secretsDatabase } = pool
  return secretsDatabase.close()
}

const dispose = async (pool: AdapterPool): Promise<any> => {
  console.log('disposing storage')
  return Promise.all([disposeEventStore(pool), disposeSecretsStore(pool)])
}

export default dispose
