import { getLog } from './get-log'
import type {
  AdapterPoolPrimal,
  ConnectionDependencies,
  SqliteAdapterPoolConnectedProps,
  SqliteAdapterConfig,
  AdapterPool,
  BetterSqliteDb,
} from './types'
import { SqliteAdapterConfigSchema } from './types'
import { validate } from '@resolve-js/eventstore-base'
import executeStatement from './execute-statement'
import executeQuery from './execute-query'

const SQLITE_BUSY = 'SQLITE_BUSY'
const randRange = (min: number, max: number): number =>
  Math.floor(Math.random() * (max - min + 1)) + min

const fullJitter = (retries: number): number =>
  randRange(0, Math.min(100, 2 * 2 ** retries))

const connect = async (
  pool: AdapterPoolPrimal,
  { BetterSqlite, tmp, os, fs }: ConnectionDependencies,
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

  let connector: () => Promise<SqliteAdapterPoolConnectedProps['database']>
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

    const memoryStoreFileName = pool.memoryStore.name
    connector = async () => {
      return new BetterSqlite(memoryStoreFileName)
    }
  } else {
    log.debug(`using disk file connector`)
    connector = async () => {
      return new BetterSqlite(databaseFile)
    }
  }

  log.debug(`connecting`)
  let database: SqliteAdapterPoolConnectedProps['database']
  for (let retry = 0; ; retry++) {
    try {
      database = await connector()
      break
    } catch (error) {
      if (error != null && error.code === SQLITE_BUSY) {
        log.warn(`received SQLITE_BUSY error code, retrying`)
        await new Promise((resolve) => setTimeout(resolve, fullJitter(retry)))
      } else {
        if (error != null) {
          log.error(error.message)
          log.verbose(error.stack)
        }
        throw error
      }
    }
  }

  log.debug(`adjusting connection`)

  const pragma = async (pragmaSetting: string) => {
    log.verbose(`PRAGMA ${pragmaSetting}`)
    database.pragma(pragmaSetting)
  }

  await pragma('busy_timeout=1000000')
  await pragma(`encoding=${escape('UTF-8')}`)
  await pragma('synchronous=EXTRA')

  if (databaseFile === ':memory:') {
    await pragma('journal_mode=MEMORY')
  } else {
    await pragma('journal_mode=DELETE')
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
      executeStatement: executeStatement.bind(null, pool as AdapterPool),
      executeQuery: executeQuery.bind(null, pool as AdapterPool),
    }
  )

  log.debug('connection to sqlite databases established')
}

export default connect
