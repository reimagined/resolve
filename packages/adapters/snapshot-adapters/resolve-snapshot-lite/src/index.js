import sqlite from 'sqlite'
import tmp from 'tmp'

const DEFAULT_BUCKET_SIZE = 100
const tableName = 'resolveSnapshotAdapter'

const escapeId = str => `"${String(str).replace(/(["])/gi, '$1$1')}"`
const escape = str => `'${String(str).replace(/(['])/gi, '$1$1')}'`

const connect = async pool => {
  if (pool.connectPromise != null) {
    return await pool.connectPromise
  }

  pool.connectPromise = (async () => {
    let connector = null
    if (pool.config && !pool.config.hasOwnProperty('databaseFile')) {
      pool.config.databaseFile = ':memory:'
      const temporaryFile = tmp.fileSync()
      pool.memoryStore = {
        ...temporaryFile,
        drop: temporaryFile.removeCallback.bind(temporaryFile)
      }
      connector = sqlite.open.bind(sqlite, pool.memoryStore.name)
    } else {
      connector = sqlite.open.bind(sqlite, pool.config.databaseFile)
    }
    pool.database = await connector()

    await pool.database.exec(`PRAGMA encoding=${escape('UTF-8')}`)
    await pool.database.exec(`PRAGMA synchronous=EXTRA`)

    if (pool.config.databaseFile === ':memory:') {
      await pool.database.exec(`PRAGMA journal_mode=MEMORY`)
    } else {
      await pool.database.exec(`PRAGMA journal_mode=DELETE`)
    }
    if (pool.config && pool.config.hasOwnProperty('bucketSize')) {
      pool.bucketSize = Number(pool.config.bucketSize)
    }

    pool.counters = new Map()

    if (!Number.isInteger(pool.bucketSize) || pool.bucketSize < 1) {
      pool.bucketSize = DEFAULT_BUCKET_SIZE
    }
  })()

  return await pool.connectPromise
}

const init = async pool => {
  if (pool.disposed) {
    throw new Error('Adapter is disposed')
  }
  await connect(pool)

  await pool.database.exec(
    `CREATE TABLE ${escapeId(tableName)} (
      ${escapeId('snapshotKey')} TEXT,
      ${escapeId('content')} TEXT
    )`
  )
}

const loadSnapshot = async (pool, snapshotKey) => {
  if (pool.disposed) {
    throw new Error('Adapter is disposed')
  }
  await connect(pool)

  const result = await pool.database.get(
    `SELECT ${escapeId('content')} 
    FROM ${escapeId(tableName)} 
    WHERE ${escapeId('snapshotKey')}=${escape(snapshotKey)}`
  )
  return result != null ? result.content : null
}

const saveSnapshot = async (pool, snapshotKey, content) => {
  if (pool.disposed) {
    throw new Error('Adapter is disposed')
  }
  await connect(pool)
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
  if (pool.disposed) {
    throw new Error('Adapter is disposed')
  }
  pool.disposed = true
  if (pool.connectPromise != null) {
    await pool.connectPromise
  }

  if (pool.counters != null) {
    pool.counters.clear()
  }

  if (pool.database != null) {
    await pool.database.close()
  }
}

const dropSnapshot = async (pool, snapshotKey) => {
  if (pool.disposed) {
    throw new Error('Adapter is disposed')
  }
  await connect(pool)

  await pool.database.exec(
    `DELETE FROM ${escapeId(tableName)} 
    WHERE ${escapeId('snapshotKey')}=${escape(snapshotKey)}`
  )
}

const drop = async pool => {
  if (pool.disposed) {
    throw new Error('Adapter is disposed')
  }
  await connect(pool)

  await pool.database.exec(`DROP TABLE ${escapeId(tableName)}`)

  if (pool.memoryStore != null) {
    try {
      await pool.memoryStore.drop()
    } catch (e) {}
  }
}

const createAdapter = config => {
  const pool = { config }

  return Object.freeze({
    loadSnapshot: loadSnapshot.bind(null, pool),
    saveSnapshot: saveSnapshot.bind(null, pool),
    dispose: dispose.bind(null, pool),
    dropSnapshot: dropSnapshot.bind(null, pool),
    init: init.bind(null, pool),
    drop: drop.bind(null, pool)
  })
}

export default createAdapter
