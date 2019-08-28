import sinon from 'sinon'

import connect from '../src/connect'

test('connect should connect to mongodb database', async () => {
  const collection = {
    createIndex: sinon.stub().callsFake(async () => null)
  }
  const database = {
    collection: sinon.stub().callsFake(async () => collection)
  }
  const client = {
    db: sinon.stub().callsFake(async () => database)
  }
  const MongoClient = {
    connect: sinon.stub().callsFake(async () => client)
  }

  const pool = {
    config: {
      url: 'url',
      collectionName: 'collectionName'
    }
  }

  await connect(
    pool,
    { MongoClient }
  )

  expect(pool.collection).toEqual(collection)
  expect(pool.database).toEqual(database)
  expect(pool.client).toEqual(client)
})
