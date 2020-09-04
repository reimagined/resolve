import getLog from './js/get-log'
import connectEventStore from './js/connect'
import { AdapterPool, AdapterSpecific } from './types'

const SQLITE_BUSY = 'SQLITE_BUSY'
const randRange = (min: number, max: number): number =>
  Math.floor(Math.random() * (max - min + 1)) + min

const fullJitter = (retries: number): number =>
  randRange(0, Math.min(100, 2 * 2 ** retries))

const connectSecretsStore = async (
  pool: AdapterPool,
  specific: AdapterSpecific
): Promise<void> => {
  const log = getLog('connectSecretsStore')

  log.debug('connecting to secrets store database')

  const {
    escape,
    config: { secretsTableName = 'default', secretsFile = 'secrets.db' },
  } = pool

  log.verbose(`secretsTableName: ${secretsTableName}`)
  log.verbose(`secretsFile: ${secretsFile}`)

  for (let retry = 0; ; retry++) {
    try {
      const secretsDatabase = await specific.sqlite.open(secretsFile)

      log.debug('adjusting connection')
      await secretsDatabase.exec(`PRAGMA busy_timeout=1000000`)
      await secretsDatabase.exec(`PRAGMA encoding=${escape('UTF-8')}`)
      await secretsDatabase.exec(`PRAGMA synchronous=EXTRA`)
      await secretsDatabase.exec(`PRAGMA journal_mode=DELETE`)

      Object.assign(pool, {
        secretsDatabase,
        secretsTableName,
      })

      log.debug('secrets store database connected successfully')
      return
    } catch (error) {
      if (error && error.code === SQLITE_BUSY) {
        log.warn(`received SQLITE_BUSY error code, retrying`)
        await new Promise((resolve) => setTimeout(resolve, fullJitter(retry)))
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
  const log = getLog('connect')
  log.debug('connecting to sqlite databases')

  const escapeId = (str: string): string =>
    `"${String(str).replace(/(["])/gi, '$1$1')}"`
  const escape = (str: string): string =>
    `'${String(str).replace(/(['])/gi, '$1$1')}'`

  Object.assign(pool, {
    escapeId,
    escape,
  })

  await Promise.all([
    connectEventStore(pool, specific),
    connectSecretsStore(pool, specific),
  ])
  log.debug('connection to sqlite databases established')
}

export default connect
