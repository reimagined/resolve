import getLog from './get-log'
import type {
  AdapterPoolPrimal,
  ConnectionDependencies,
  SqliteAdapterPoolConnectedProps,
  SqliteAdapterConfig,
} from './types'
import { SqliteAdapterConfigSchema } from './types'
import { validate } from '@resolve-js/eventstore-base'

const SQLITE_BUSY = 'SQLITE_BUSY'
const randRange = (min: number, max: number): number =>
  Math.floor(Math.random() * (max - min + 1)) + min

const fullJitter = (retries: number): number =>
  randRange(0, Math.min(100, 2 * 2 ** retries))

const connect = async (
  pool: AdapterPoolPrimal,
  { sqlite, tmp, os, fs }: ConnectionDependencies,
  config: SqliteAdapterConfig
): Promise<void> => {
  const log = getLog('connect')
  log.debug('connecting to sqlite databases')

  const escapeId = (str: string): string =>
    `"${String(str).replace(/(["])/gi, '$1$1')}"`
  const escape = (str: string): string =>
    `'${String(str).replace(/(['])/gi, '$1$1')}'`

  pool.escape = escape
  pool.escapeId = escapeId

  log.debug(`connecting to events database`)

  validate(SqliteAdapterConfigSchema, config)

  const databaseFile = config.databaseFile ?? ':memory:'
  const eventsTableName = config.eventsTableName ?? 'events'
  const snapshotsTableName = config.snapshotsTableName ?? 'snapshots'
  const secretsTableName = config.secretsTableName ?? 'secrets'
  const subscribersTableName = config.subscribersTableName ?? 'subscribers'

  log.verbose(`databaseFile: ${databaseFile}`)
  log.verbose(`eventsTableName: ${eventsTableName}`)
  log.verbose(`snapshotsTableName: ${snapshotsTableName}`)
  log.verbose(`secretsTableName: ${secretsTableName}`)
  log.verbose(`subscribersTableName: ${subscribersTableName}`)

  let connector
  if (databaseFile === ':memory:') {
    log.debug(`using memory connector`)
    if (process.env.RESOLVE_LAUNCH_ID != null) {
      const tmpName = `${os.tmpdir()}/storage-${+process.env
        .RESOLVE_LAUNCH_ID}.db`
      const removeCallback = () => {
        if (fs.existsSync(tmpName)) {
          fs.unlinkSync(tmpName)
        }
      }

      if (!fs.existsSync(tmpName)) {
        fs.writeFileSync(tmpName, '')
        process.on('SIGINT', removeCallback)
        process.on('SIGTERM', removeCallback)
        process.on('beforeExit', removeCallback)
        process.on('exit', removeCallback)
      }

      pool.memoryStore = {
        name: tmpName,
        drop: removeCallback,
      }
    } else {
      const temporaryFile = tmp.fileSync()
      pool.memoryStore = {
        name: temporaryFile.name,
        drop: temporaryFile.removeCallback.bind(temporaryFile),
      }
    }

    connector = sqlite.open.bind(sqlite, pool.memoryStore.name)
  } else {
    log.debug(`using disk file connector`)
    connector = sqlite.open.bind(sqlite, databaseFile)
  }

  log.debug(`connecting`)
  let database
  for (let retry = 0; ; retry++) {
    try {
      database = await connector()
      break
    } catch (error) {
      if (error != null && error.code === SQLITE_BUSY) {
        log.warn(`received SQLITE_BUSY error code, retrying`)
        await new Promise((resolve) => setTimeout(resolve, fullJitter(retry)))
      } else {
        log.error(error.message)
        log.verbose(error.stack)
        throw error
      }
    }
  }

  log.debug(`adjusting connection`)

  log.verbose(`PRAGMA busy_timeout=1000000`)
  await database.exec(`PRAGMA busy_timeout=1000000`)

  log.verbose(`PRAGMA encoding=${escape('UTF-8')}`)
  await database.exec(`PRAGMA encoding=${escape('UTF-8')}`)

  log.verbose(`PRAGMA synchronous=EXTRA`)
  await database.exec(`PRAGMA synchronous=EXTRA`)

  if (databaseFile === ':memory:') {
    log.verbose(`PRAGMA journal_mode=MEMORY`)
    await database.exec(`PRAGMA journal_mode=MEMORY`)
  } else {
    log.verbose(`PRAGMA journal_mode=DELETE`)
    await database.exec(`PRAGMA journal_mode=DELETE`)
  }

  Object.assign<AdapterPoolPrimal, Partial<SqliteAdapterPoolConnectedProps>>(
    pool,
    {
      database,
      databaseFile,
      eventsTableName,
      snapshotsTableName,
      secretsTableName,
      subscribersTableName,
    }
  )

  log.debug('connection to sqlite databases established')
}

export default connect
