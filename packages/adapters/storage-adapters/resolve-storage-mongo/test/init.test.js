import sinon from 'sinon'

import init from '../src/init'

test('init should prepare indexes', async () => {
  const collection = {
    createIndex: sinon.stub().callsFake(async () => null)
  }

  const pool = {
    collection
  }

  await init(pool)

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
})
