import getLog from 'resolve-debug-levels'
import disposeEventStore from './js/drop'
import { AdapterPool } from './types'

const disposeSecretsStore = (pool: AdapterPool): Promise<any> => {
  const { secretsDatabase } = pool
  return secretsDatabase.close()
}

const dispose = async (pool: AdapterPool): Promise<any> => {
  const log = getLog('dispose')

  log.debug(`disposing the event store`)
  await Promise.all([disposeEventStore(pool), disposeSecretsStore(pool)])
  log.debug(`the event store disposed`)
}

export default dispose
