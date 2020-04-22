import getLog from 'resolve-debug-levels'
import connectEventStore from './js/connect'
import { AdapterPool, AdapterSpecific } from './types'
import logNamespace from './log-namespace'

const SQLITE_BUSY = 'SQLITE_BUSY'
const randRange = (min: number, max: number): number =>
  Math.floor(Math.random() * (max - min + 1)) + min

const fullJitter = (retries: number): number =>
  randRange(0, Math.min(100, 2 * 2 ** retries))

const connectSecretsStore = async (
  pool: AdapterPool,
  specific: AdapterSpecific
): Promise<void> => {
  const log = getLog(logNamespace('connectSecretsStore'))

  log.debug('connecting to secrets store database')
  const secretsTableName = pool.config.secretsTableName || 'default'
  log.verbose(`secretsTableName: ${secretsTableName}`)
  log.verbose(`secretsFile: ${pool.config.secretsFile}`)

  for (let retry = 0; ; retry++) {
    try {
      const secretsDatabase = await specific.sqlite.open(
        pool.config.secretsFile
      )

      Object.assign(pool, {
        secretsDatabase,
        secretsTableName
      })

      log.debug('secrets store database connected successfully')
      return
    } catch (error) {
      if (error && error.code === SQLITE_BUSY) {
        log.warn(`received SQLITE_BUSY error code, retrying`)
        await new Promise(resolve => setTimeout(resolve, fullJitter(retry)))
      } else {
        log.error(error.message)
        log.verbose(error.stack)
        throw error
      }
    }
  }
}

const connect = async (
  pool: AdapterPool,
  specific: AdapterSpecific
): Promise<any> => {
  const log = getLog(logNamespace('connect'))
  log.debug('connecting to sqlite databases')
  await Promise.all([
    connectEventStore(pool, specific),
    connectSecretsStore(pool, specific)
  ])
  log.debug('connection to sqlite databases established')
}

export default connect
