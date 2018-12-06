import sinon from 'sinon'

import dispose from '../src/dispose'

test('dispose should free resources by default', async () => {
  const pool = {
    promiseInvoke: async (func, ...args) => await func(...args),
    database: {
      remove: sinon.stub().callsFake(async () => null),
      resetIndexes: sinon.stub()
    }
  }

  await dispose(pool, {})

  expect(pool.database.remove.callCount).toEqual(0)
  expect(pool.database.resetIndexes.callCount).toEqual(0)
})

test('dispose should free resources and drop events with "dropEvents" option', async () => {
  const pool = {
    promiseInvoke: async (func, ...args) => await func(...args),
    database: {
      remove: sinon.stub().callsFake(async () => null),
      resetIndexes: sinon.stub()
    }
  }

  await dispose(pool, { dropEvents: true })

  expect(pool.database.remove.callCount).toEqual(1)
  expect(pool.database.resetIndexes.callCount).toEqual(1)

  expect(pool.database.remove.firstCall.args).toEqual([{}, { multi: true }])
  expect(pool.database.resetIndexes.firstCall.args).toEqual([])
})
