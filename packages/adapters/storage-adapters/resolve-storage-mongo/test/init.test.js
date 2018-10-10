import sinon from 'sinon'

import init from '../src/init'

test('init should connect to mongodb database and prepare indexes', async () => {
  const collection = {
    createIndex: sinon.stub().callsFake(async () => null)
  }
  const db = {
    collection: sinon.stub().callsFake(async () => collection)
  }
  const client = {
    db: sinon.stub().callsFake(async () => db)
  }
  const MongoClient = {
    connect: sinon.stub().callsFake(async () => client)
  }

  const pool = {
    config: {
      url: 'url',
      collectionName: 'collectionName',
      databaseName: 'databaseName'
    }
  }

  await init(MongoClient, pool)

  expect(pool.collection.createIndex.callCount).toEqual(4)
  expect(pool.collection.createIndex.getCall(0).args).toEqual(['timestamp'])
  expect(pool.collection.createIndex.getCall(1).args).toEqual(['aggregateId'])
  expect(pool.collection.createIndex.getCall(2).args).toEqual([
    { timestamp: 1, aggregateVersion: 1 }
  ])
  expect(pool.collection.createIndex.getCall(3).args).toEqual([
    { aggregateId: 1, aggregateVersion: 1 },
    { unique: true }
  ])

  expect(pool.collection).toEqual(collection)
  expect(pool.db).toEqual(db)
  expect(pool.client).toEqual(client)
})
