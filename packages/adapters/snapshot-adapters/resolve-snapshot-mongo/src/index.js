import { MongoClient } from 'mongodb'

const init = async pool => {
  if (pool.initPromise != null) {
    return pool.initPromise
  }
  pool.initPromise = (async () => {
    const {
      url,
      tableName,
      bucketSize = 100,
      ...connectionOptions
    } = pool.config
    pool.bucketSize = bucketSize
    pool.client = await MongoClient.connect(url, {
      ...connectionOptions,
      useNewUrlParser: true
    })
    pool.database = await pool.client.db()
    pool.collection = await pool.database.collection(tableName)

    pool.counters = new Map()

    pool.collection.createIndex('snapshotKey')
    pool.collection.createIndex('content')
  })()
  return pool.initPromise
}

const loadSnapshot = async (pool, snapshotKey) => {
  await init(pool)
  if (pool.disposed) {
    throw new Error('Adapter is disposed')
  }

  const result = await pool.collection.findOne({ snapshotKey })
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

  await pool.collection.insertOne({
    snapshotKey,
    content
  })
}

const dispose = async pool => {
  await init(pool)
  if (pool.disposed) {
    throw new Error('Adapter is disposed')
  }
  pool.disposed = true

  pool.counters.clear()
  await pool.client.close()
}

const drop = async (pool, snapshotKey) => {
  await init(pool)
  if (pool.disposed) {
    throw new Error('Adapter is disposed')
  }

  await pool.collection.findOneAndDelete({ snapshotKey })
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
