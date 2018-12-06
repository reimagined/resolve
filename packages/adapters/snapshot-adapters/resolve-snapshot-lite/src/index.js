import NeDB from 'nedb'

const DEFAULT_BUCKET_SIZE = 100

const init = async pool => {
  if (pool.initPromise != null) {
    return pool.initPromise
  }

  pool.initPromise = (async () => {
    pool.db = new NeDB(
      pool.config && pool.config.hasOwnProperty('pathToFile')
        ? { filename: pool.config.pathToFile }
        : { inMemoryOnly: true }
    )

    await new Promise((resolve, reject) =>
      pool.db.loadDatabase(err => (err ? reject(err) : resolve()))
    )

    await new Promise((resolve, reject) =>
      pool.db.ensureIndex({ fieldName: 'snapshotKey', unique: true }, err =>
        err ? reject(err) : resolve()
      )
    )

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

  const result = await new Promise((resolve, reject) =>
    pool.db.findOne({ snapshotKey }, (err, doc) =>
      err ? reject(err) : resolve(doc)
    )
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

  await new Promise((resolve, reject) =>
    pool.db.update(
      { snapshotKey },
      { snapshotKey, content },
      { upsert: true },
      err => (err ? reject(err) : resolve())
    )
  )
}

const dispose = async (pool, options) => {
  await init(pool)
  if (pool.disposed) {
    throw new Error('Adapter is disposed')
  }
  pool.disposed = true

  pool.counters.clear()

  if (options && options.dropSnapshots) {
    await new Promise((resolve, reject) =>
      pool.db.remove({}, { multi: true }, err =>
        err ? reject(err) : resolve()
      )
    )
  }
}

const createAdapter = config => {
  const pool = { config }

  return Object.freeze({
    loadSnapshot: loadSnapshot.bind(null, pool),
    saveSnapshot: saveSnapshot.bind(null, pool),
    dispose: dispose.bind(null, pool)
  })
}

export default createAdapter
