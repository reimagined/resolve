import sinon from 'sinon'

import dispose from '../src/dispose'

test('dispose should free resources by default', async () => {
  const pool = {
    promiseInvoke: async (func, ...args) => await func(...args),
    db: {
      remove: sinon.stub().callsFake(async () => null),
      clearIndexes: sinon.stub()
    }
  }

  await dispose(pool, {})

  expect(pool.db.remove.callCount).toEqual(0)
  expect(pool.db.clearIndexes.callCount).toEqual(0)
})

test('dispose should free resources and drop events with "dropEvents" option', async () => {
  const pool = {
    promiseInvoke: async (func, ...args) => await func(...args),
    db: {
      remove: sinon.stub().callsFake(async () => null),
      clearIndexes: sinon.stub()
    }
  }

  await dispose(pool, { dropEvents: true })

  expect(pool.db.remove.callCount).toEqual(1)
  expect(pool.db.clearIndexes.callCount).toEqual(1)

  expect(pool.db.remove.firstCall.args).toEqual([{}, { multi: true }])
  expect(pool.db.clearIndexes.firstCall.args).toEqual([])
})
