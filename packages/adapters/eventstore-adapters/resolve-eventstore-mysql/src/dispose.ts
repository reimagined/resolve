import getLog from 'resolve-debug-levels'
import disposeEventStore from './js/dispose'
import { AdapterPool } from './types'

const disposeSecretsStore = async (pool: AdapterPool): Promise<any> => {
  const log = getLog(`disposeSecretsStore`)
  const {
    secrets: { connection }
  } = pool
  log.debug(`closing mysql connection`)

  await connection.end()

  log.debug(`mysql connection closed`)
}

const dispose = async (pool: AdapterPool): Promise<any> => {
  const log = getLog('dispose')

  log.debug(`disposing the event store`)
  await Promise.all([disposeEventStore(pool), disposeSecretsStore(pool)])
  log.debug(`the event store disposed`)
}

export default dispose
