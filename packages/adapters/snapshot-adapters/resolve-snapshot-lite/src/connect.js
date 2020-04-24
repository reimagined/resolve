const DEFAULT_BUCKET_SIZE = 100
const tableName = 'resolveSnapshotAdapter'

const connect = async pool => {
  const escapeId = str => `"${String(str).replace(/(["])/gi, '$1$1')}"`
  const escape = str => `'${String(str).replace(/(['])/gi, '$1$1')}'`

  Object.assign(pool, {
    databaseFile:
      pool.config.databaseFile != null ? pool.config.databaseFile : ':memory:',
    bucketSize:
      pool.config.bucketSize != null
        ? ~~pool.config.bucketSize
        : DEFAULT_BUCKET_SIZE,
    tableName,
    escapeId,
    escape
  })

  let connector = null
  if (pool.databaseFile === ':memory:') {
    if (process.env.RESOLVE_LAUNCH_ID != null) {
      const tmpName = `${pool.os.tmpdir()}/snapshot-${+process.env
        .RESOLVE_LAUNCH_ID}.db`
      const removeCallback = () => {
        if (pool.fs.existsSync(tmpName)) {
          pool.fs.unlinkSync(tmpName)
        }
      }

      if (!pool.fs.existsSync(tmpName)) {
        pool.fs.writeFileSync(tmpName, '')
        process.on('SIGINT', removeCallback)
        process.on('SIGTERM', removeCallback)
        process.on('beforeExit', removeCallback)
        process.on('exit', removeCallback)
      }

      pool.memoryStore = {
        name: tmpName,
        drop: removeCallback
      }
    } else {
      const temporaryFile = pool.tmp.fileSync()
      pool.memoryStore = {
        name: temporaryFile.name,
        drop: temporaryFile.removeCallback.bind(temporaryFile)
      }
    }

    connector = pool.sqlite.open.bind(pool.sqlite, pool.memoryStore.name)
  } else {
    connector = pool.sqlite.open.bind(pool.sqlite, pool.databaseFile)
  }
  pool.database = await connector()

  await pool.database.exec(`PRAGMA encoding=${escape('UTF-8')}`)
  await pool.database.exec(`PRAGMA synchronous=EXTRA`)

  if (pool.databaseFile === ':memory:') {
    await pool.database.exec(`PRAGMA journal_mode=MEMORY`)
  } else {
    await pool.database.exec(`PRAGMA journal_mode=DELETE`)
  }

  pool.counters = new Map()

  if (!Number.isInteger(pool.bucketSize) || pool.bucketSize < 1) {
    pool.bucketSize = DEFAULT_BUCKET_SIZE
  }
}

export default connect
