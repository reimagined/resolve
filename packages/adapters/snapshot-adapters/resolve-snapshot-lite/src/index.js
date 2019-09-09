import sqlite from 'sqlite'

const DEFAULT_BUCKET_SIZE = 100
const tableName = 'resolveSnapshotAdapter'

const escapeId = str => `"${String(str).replace(/(["])/gi, '$1$1')}"`
const escape = str => `'${String(str).replace(/(['])/gi, '$1$1')}'`

const init = async pool => {
  if (pool.initPromise != null) {
    return pool.initPromise
  }

  pool.initPromise = (async () => {
    pool.database = await sqlite.open(
      pool.config && pool.config.hasOwnProperty('databaseFile')
        ? pool.config.databaseFile
        : (pool.config.databaseFile = ':memory:')
    )

    await pool.database.exec(`PRAGMA encoding=${escape('UTF-8')}`)
    await pool.database.exec(`PRAGMA synchronous=EXTRA`)

    if (pool.config.databaseFile === ':memory:') {
      await pool.database.exec(`PRAGMA journal_mode=MEMORY`)
    } else {
      await pool.database.exec(`PRAGMA journal_mode=DELETE`)
    }

    await pool.database.exec(`CREATE TABLE IF NOT EXISTS ${escapeId(
      tableName
    )} (
      ${escapeId('snapshotKey')} TEXT,
      ${escapeId('content')} TEXT
    )`)

    if (pool.config && pool.config.hasOwnProperty('bucketSize')) {
      pool.bucketSize = Number(pool.config.bucketSize)
    }

    pool.counters = new Map()

    if (!Number.isInteger(pool.bucketSize) || pool.bucketSize < 1) {
      pool.bucketSize = DEFAULT_BUCKET_SIZE
    }
  })()

  return pool.initPromise
}

const loadSnapshot = async (pool, snapshotKey) => {
  await init(pool)
  if (pool.disposed) {
    throw new Error('Adapter is disposed')
  }

  const result = await pool.database.get(
    `SELECT ${escapeId('content')} 
    FROM ${escapeId(tableName)} 
    WHERE ${escapeId('snapshotKey')}=${escape(snapshotKey)}`
  )
  return result != null ? result.content : null
}

const saveSnapshot = async (pool, snapshotKey, content) => {
  await init(pool)
  if (pool.disposed) {
    throw new Error('Adapter is disposed')
  }
  if (!pool.counters.has(snapshotKey)) {
    pool.counters.set(snapshotKey, 0)
  }

  if (pool.counters.get(snapshotKey) < pool.bucketSize) {
    pool.counters.set(snapshotKey, pool.counters.get(snapshotKey) + 1)
    return
  }
  pool.counters.set(snapshotKey, 0)

  await pool.database.exec(
    `INSERT INTO ${escapeId(tableName)} 
    VALUES (${escape(snapshotKey)}, ${escape(content)})`
  )
}

const dispose = async pool => {
  await init(pool)
  if (pool.disposed) {
    throw new Error('Adapter is disposed')
  }
  pool.disposed = true

  pool.counters.clear()
  await pool.database.close()
}

const drop = async (pool, snapshotKey) => {
  await init(pool)
  if (pool.disposed) {
    throw new Error('Adapter is disposed')
  }

  await pool.database.exec(
    `DELETE FROM ${escapeId(tableName)} 
    WHERE ${escapeId('snapshotKey')}=${escape(snapshotKey)}`
  )
}

const createAdapter = config => {
  const pool = { config }

  return Object.freeze({
    loadSnapshot: loadSnapshot.bind(null, pool),
    saveSnapshot: saveSnapshot.bind(null, pool),
    dispose: dispose.bind(null, pool),
    drop: drop.bind(null, pool)
  })
}

export default createAdapter
