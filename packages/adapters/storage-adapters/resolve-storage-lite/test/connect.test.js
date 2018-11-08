import sinon from 'sinon'

import connect from '../src/connect'

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

  const promiseInvoke = sinon.stub()

  await connect(
    pool,
    { NeDB, promiseInvoke }
  )

  expect(NeDB.firstCall.args[0]).toEqual({ filename: 'pathToFile' })

  expect(pool.promiseInvoke).toEqual(promiseInvoke)
})

test('init should prepare memory-storage mode and return the correct interface', async () => {
  const pool = {
    config: {}
  }

  const loadDatabase = sinon.stub().callsFake(callback => callback())
  const ensureIndex = sinon.stub().callsFake((key, callback) => callback())

  const NeDB = sinon.stub().callsFake(function() {
    this.loadDatabase = loadDatabase
    this.ensureIndex = ensureIndex
  })

  const promiseInvoke = sinon.stub()

  await connect(
    pool,
    { NeDB, promiseInvoke }
  )

  expect(NeDB.firstCall.args[0]).toEqual({ inMemoryOnly: true })

  expect(pool.promiseInvoke).toEqual(promiseInvoke)
})
