import getLog from './get-log'

const coerceEmptyString = (obj) =>
  (obj != null && obj.constructor !== String) || obj == null ? 'default' : obj

const connectEventStore = async (pool, { sqlite, tmp, os, fs }) => {
  const log = getLog('connectEventStore')

  log.debug(`connecting to events database`)
  const { escape } = pool
  let {
    databaseFile,
    eventsTableName = 'events',
    snapshotsTableName = 'snapshots',
    ...initOptions
  } = pool.config

  databaseFile = coerceEmptyString(databaseFile)
  eventsTableName = coerceEmptyString(eventsTableName)
  snapshotsTableName = coerceEmptyString(snapshotsTableName)

  log.verbose(`databaseFile: ${databaseFile}`)
  log.verbose(`eventsTableName: ${eventsTableName}`)
  log.verbose(`snapshotsTableName: ${snapshotsTableName}`)

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
  const database = await connector()

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

  Object.assign(pool, {
    database,
    eventsTableName,
    snapshotsTableName,
    initOptions,
  })

  log.debug(`events store database connected successfully`)
}

export default connectEventStore
