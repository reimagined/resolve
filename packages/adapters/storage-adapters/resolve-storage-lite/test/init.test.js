import sinon from 'sinon'

import init from '../src/init'
import promiseInvoke from '../src/promise-invoke'

test('init should prepare file-storage mode and return the correct interface', async () => {
  const loadDatabase = sinon.stub().callsFake(callback => callback())
  const ensureIndex = sinon.stub().callsFake((key, callback) => callback())

  const database = {
    loadDatabase,
    ensureIndex
  }

  const pool = {
    config: {
      pathToFile: 'pathToFile'
    },
    promiseInvoke,
    database
  }

  await init(pool)

  expect(loadDatabase.callCount).toEqual(1)
  expect(ensureIndex.callCount).toEqual(4)

  expect(ensureIndex.getCall(0).args[0]).toEqual({
    fieldName: 'aggregateIdAndVersion',
    unique: true,
    sparse: true
  })

  expect(ensureIndex.getCall(1).args[0]).toEqual({
    fieldName: 'aggregateId'
  })

  expect(ensureIndex.getCall(2).args[0]).toEqual({
    fieldName: 'aggregateVersion'
  })

  expect(ensureIndex.getCall(3).args[0]).toEqual({
    fieldName: 'type'
  })

  expect(pool.promiseInvoke).toEqual(promiseInvoke)

  const testCallbackFunc = (arg, callback) => {
    if (arg instanceof Error) {
      callback(arg, null)
    } else {
      callback(null, arg)
    }
  }

  const result = await pool.promiseInvoke(testCallbackFunc, 123)
  expect(result).toEqual(123)

  const testError = new Error('Test error')
  try {
    await pool.promiseInvoke(testCallbackFunc, testError)

    return Promise.reject('Test failed')
  } catch (error) {
    expect(error).toEqual(testError)
  }
})
