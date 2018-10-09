import sinon from 'sinon'

import dispose from '../src/dispose'

test('dispose should free resources by default', async () => {
  const pool = {
    collection: {
      deleteMany: sinon.stub().callsFake(async () => null),
      dropIndexes: sinon.stub().callsFake(async () => null)
    },
    client: {
      close: sinon.stub().callsFake(async () => null)
    }
  }

  await dispose(pool, {})

  expect(pool.collection.deleteMany.callCount).toEqual(0)
  expect(pool.collection.dropIndexes.callCount).toEqual(0)

  expect(pool.client.close.callCount).toEqual(1)
})

test('dispose should free resources and drop events with "dropEvents" option', async () => {
  const pool = {
    collection: {
      deleteMany: sinon.stub().callsFake(async () => null),
      dropIndexes: sinon.stub().callsFake(async () => null)
    },
    client: {
      close: sinon.stub().callsFake(async () => null)
    }
  }

  await dispose(pool, { dropEvents: true })

  expect(pool.collection.deleteMany.callCount).toEqual(1)
  expect(pool.collection.dropIndexes.callCount).toEqual(1)

  expect(pool.collection.deleteMany.firstCall.args).toEqual([{}])
  expect(pool.collection.dropIndexes.firstCall.args).toEqual([])

  expect(pool.client.close.callCount).toEqual(1)
})
