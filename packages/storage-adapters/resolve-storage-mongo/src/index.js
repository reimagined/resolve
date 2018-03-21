import { MongoClient } from 'mongodb'
import { ConcurrentError } from 'resolve-storage-base'

const DUPLICATE_KEY_ERROR = 11000

function loadEvents(coll, query, startTime, callback) {
  const iterate = cursor =>
    cursor.next().then(item => {
      if (item === null) return
      return Promise.resolve(callback(item)).then(() => iterate(cursor))
    })

  return iterate(
    coll.find(
      { ...query, timestamp: { $gte: startTime } },
      { sort: 'timestamp' }
    )
  )
}

function createAdapter({ url, collection }) {
  let promise, db

  function getCollection() {
    if (!promise) {
      promise = MongoClient.connect(url)
        .then(connection => {
          db = connection
          return db.collection(collection)
        })
        .then(coll =>
          coll
            .createIndex('timestamp')
            .then(() => coll.createIndex('aggregateId'))
            .then(() =>
              coll.createIndex(
                { aggregateId: 1, aggregateVersion: 1 },
                { unique: true }
              )
            )
            .then(() => coll)
        )
    }
    return promise
  }

  return {
    saveEvent: event =>
      getCollection().then(coll =>
        coll.insert(event).catch(e => {
          if (e.code === DUPLICATE_KEY_ERROR) {
            throw new ConcurrentError()
          }
          throw e
        })
      ),

    loadEventsByTypes: (types, callback, startTime = 0) =>
      getCollection().then(coll =>
        loadEvents(coll, { type: { $in: types } }, startTime, callback)
      ),

    loadEventsByAggregateIds: (aggregateIds, callback, startTime = 0) =>
      getCollection().then(coll =>
        loadEvents(
          coll,
          { aggregateId: { $in: aggregateIds } },
          startTime,
          callback
        )
      ),
    dispose: () => (db ? db.close() : Promise.resolve())
  }
}

export default createAdapter
