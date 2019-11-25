import { MongoClient } from 'mongodb'

const connect = async pool => {
  if (pool.connectPromise != null) {
    return await pool.connectPromise
  }

  pool.connectPromise = (async () => {
    const { url, bucketSize = 100, ...connectionOptions } = pool.config
    pool.bucketSize = bucketSize
    pool.counters = new Map()

    pool.client = await MongoClient.connect(url, {
      ...connectionOptions,
      useNewUrlParser: true
    })
  })()

  return await pool.connectPromise
}

const init = async pool => {
  await connect(pool)
  if (pool.disposed) {
    throw new Error('Adapter is disposed')
  }

  pool.database = await pool.client.db()
  pool.collection = await pool.database.collection(pool.config.tableName)

  pool.collection.createIndex('snapshotKey')
  pool.collection.createIndex('content')
}

const loadSnapshot = async (pool, snapshotKey) => {
  await connect(pool)
  if (pool.disposed) {
    throw new Error('Adapter is disposed')
  }

  const result = await pool.collection.findOne({ snapshotKey })
  return result != null ? result.content : null
}

const saveSnapshot = async (pool, snapshotKey, content) => {
  await connect(pool)
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
  if (pool.disposed) {
    throw new Error('Adapter is disposed')
  }
  pool.disposed = true

  pool.counters.clear()
  await pool.client.close()
}

const dropSnapshot = async (pool, snapshotKey) => {
  await connect(pool)
  if (pool.disposed) {
    throw new Error('Adapter is disposed')
  }

  await pool.collection.findOneAndDelete({ snapshotKey })
}

const drop = async pool => {
  await connect(pool)
  if (pool.disposed) {
    throw new Error('Adapter is disposed')
  }

  await pool.collection.drop()
}

const createAdapter = config => {
  const pool = { config }

  return Object.freeze({
    loadSnapshot: loadSnapshot.bind(null, pool),
    saveSnapshot: saveSnapshot.bind(null, pool),
    dispose: dispose.bind(null, pool),
    drop: drop.bind(null, pool),
    dropSnapshot: dropSnapshot.bind(null, pool),
    init: init.bind(null, pool)
  })
}

export default createAdapter
