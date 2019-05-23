import NeDB from 'nedb'
import { promisify } from 'util'

const DEFAULT_BUCKET_SIZE = 100

const init = async pool => {
  if (pool.initPromise != null) {
    return pool.initPromise
  }

  pool.initPromise = (async () => {
    const database = new NeDB(
      pool.config && pool.config.hasOwnProperty('databaseFile')
        ? { filename: pool.config.databaseFile }
        : { inMemoryOnly: true }
    )

    pool.db = {
      loadDatabase: promisify(database.loadDatabase.bind(database)),
      ensureIndex: promisify(database.ensureIndex.bind(database)),
      findOne: promisify(database.findOne.bind(database)),
      update: promisify(database.update.bind(database)),
      remove: promisify(database.remove.bind(database))
    }

    await pool.db.loadDatabase()

    await pool.db.ensureIndex({ fieldName: 'snapshotKey', unique: true })

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

  const result = await pool.db.findOne({ snapshotKey })

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

  await pool.db.update(
    { snapshotKey },
    { snapshotKey, content },
    { upsert: true }
  )
}

const dispose = async pool => {
  await init(pool)
  if (pool.disposed) {
    throw new Error('Adapter is disposed')
  }
  pool.disposed = true

  pool.counters.clear()
}

const drop = async (pool, snapshotKey) => {
  await init(pool)
  if (pool.disposed) {
    throw new Error('Adapter is disposed')
  }

  await pool.db.remove(
    {
      $where: function() {
        return this.snapshotKey.indexOf(snapshotKey) === 0
      }
    },
    { multi: true }
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
