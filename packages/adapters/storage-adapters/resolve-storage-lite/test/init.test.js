import sinon from 'sinon'

import init from '../src/init'

test('init should prepare file-storage mode and return the correct interface', async () => {
  const pool = {
    config: {
      pathToFile: 'pathToFile'
    }
  }

  const loadDatabase = sinon.stub().callsFake(callback => callback())
  const ensureIndex = sinon.stub().callsFake((key, callback) => callback())

  const NeDB = sinon.stub().callsFake(function() {
    this.loadDatabase = loadDatabase
    this.ensureIndex = ensureIndex
  })

  await init(NeDB, pool)

  expect(NeDB.firstCall.args[0]).toEqual({ filename: 'pathToFile' })

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

  expect(pool.promiseInvoke).toBeInstanceOf(Function)

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

test('init should prepare memory mode and return the correct interface', async () => {
  const pool = {
    config: {}
  }

  const loadDatabase = sinon.stub().callsFake(callback => callback())
  const ensureIndex = sinon.stub().callsFake((key, callback) => callback())

  const NeDB = sinon.stub().callsFake(function() {
    this.loadDatabase = loadDatabase
    this.ensureIndex = ensureIndex
  })

  await init(NeDB, pool)

  expect(NeDB.firstCall.args[0]).toEqual({ inMemoryOnly: true })

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
})
