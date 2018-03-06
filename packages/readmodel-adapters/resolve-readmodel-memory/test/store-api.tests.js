import { expect } from 'chai'
import sinon from 'sinon'

import storeApi from '../src/store-api'

describe('resolve-readmodel-memory store-api', () => {
  const makeFindStubStorage = (storageName, findResult) => {
    const impl = methods =>
      sinon.stub().callsFake(search => {
        const result = {}
        methods.forEach(key => {
          result[key] = sinon.stub().callsFake(val => result)
        })
        result.exec = sinon.stub().callsFake(cb => cb(null, findResult))
        return result
      })

    const storage = {
      [storageName]: {
        find: impl(['sort', 'skip', 'limit', 'projection']),
        findOne: impl(['projection'])
      }
    }
    return storage
  }

  it('should provide defineStorage method', async () => {
    const newStorage = {
      ensureIndex: sinon.stub().callsFake(({ fieldName }, cb) => cb(null))
    }
    const storage = {}

    await storeApi.defineStorage(
      { createStorage: () => newStorage, storage },
      'test',
      {
        primaryIndex: { name: 'first' },
        secondaryIndexes: [{ name: 'second' }, { name: 'third' }]
      }
    )

    expect(newStorage.ensureIndex.firstCall.args[0].fieldName).to.be.equal(
      'first'
    )
    expect(newStorage.ensureIndex.secondCall.args[0].fieldName).to.be.equal(
      'second'
    )
    expect(newStorage.ensureIndex.thirdCall.args[0].fieldName).to.be.equal(
      'third'
    )
    expect(storage['test']).to.be.equal(newStorage)
  })

  it('should provide find method - all arguments passed', async () => {
    const gaugeResultSet = []
    const storage = makeFindStubStorage('test', gaugeResultSet)

    const result = await storeApi.find(
      { storage },
      'test',
      { search: 0 },
      { field: 1 },
      { sort: -1 },
      10,
      20
    )

    expect(storage['test'].find.firstCall.args[0]).to.be.deep.equal({
      search: 0
    })
    const cursor = storage['test'].find.firstCall.returnValue

    expect(cursor.projection.firstCall.args[0]).to.be.deep.equal({
      field: 1,
      _id: 0
    })
    expect(cursor.sort.firstCall.args[0]).to.be.deep.equal({ sort: -1 })
    expect(cursor.skip.firstCall.args[0]).to.be.equal(10)
    expect(cursor.limit.firstCall.args[0]).to.be.equal(20)

    expect(result).to.be.equal(gaugeResultSet)
  })

  it('should provide find method - no projection passed', async () => {
    const gaugeResultSet = []
    const storage = makeFindStubStorage('test', gaugeResultSet)

    const result = await storeApi.find(
      { storage },
      'test',
      { search: 0 },
      null,
      { sort: -1 },
      10,
      20
    )

    expect(storage['test'].find.firstCall.args[0]).to.be.deep.equal({
      search: 0
    })
    const cursor = storage['test'].find.firstCall.returnValue

    expect(cursor.projection.firstCall.args[0]).to.be.deep.equal({ _id: 0 })
    expect(cursor.sort.firstCall.args[0]).to.be.deep.equal({ sort: -1 })
    expect(cursor.skip.firstCall.args[0]).to.be.equal(10)
    expect(cursor.limit.firstCall.args[0]).to.be.equal(20)

    expect(result).to.be.equal(gaugeResultSet)
  })

  it('should provide find method - no sort passed', async () => {
    const gaugeResultSet = []
    const storage = makeFindStubStorage('test', gaugeResultSet)

    const result = await storeApi.find(
      { storage },
      'test',
      { search: 0 },
      { field: 1 },
      null,
      10,
      20
    )

    expect(storage['test'].find.firstCall.args[0]).to.be.deep.equal({
      search: 0
    })
    const cursor = storage['test'].find.firstCall.returnValue

    expect(cursor.projection.firstCall.args[0]).to.be.deep.equal({
      field: 1,
      _id: 0
    })
    expect(cursor.sort.callCount).to.be.equal(0)
    expect(cursor.skip.firstCall.args[0]).to.be.equal(10)
    expect(cursor.limit.firstCall.args[0]).to.be.equal(20)

    expect(result).to.be.equal(gaugeResultSet)
  })

  it('should provide find method - no skip passed', async () => {
    const gaugeResultSet = []
    const storage = makeFindStubStorage('test', gaugeResultSet)

    const result = await storeApi.find(
      { storage },
      'test',
      { search: 0 },
      { field: 1 },
      { sort: -1 },
      Infinity,
      20
    )

    expect(storage['test'].find.firstCall.args[0]).to.be.deep.equal({
      search: 0
    })
    const cursor = storage['test'].find.firstCall.returnValue

    expect(cursor.projection.firstCall.args[0]).to.be.deep.equal({
      field: 1,
      _id: 0
    })
    expect(cursor.sort.firstCall.args[0]).to.be.deep.equal({ sort: -1 })
    expect(cursor.skip.callCount).to.be.equal(0)
    expect(cursor.limit.firstCall.args[0]).to.be.equal(20)

    expect(result).to.be.equal(gaugeResultSet)
  })

  it('should provide find method - no limit passed', async () => {
    const gaugeResultSet = []
    const storage = makeFindStubStorage('test', gaugeResultSet)

    const result = await storeApi.find(
      { storage },
      'test',
      { search: 0 },
      { field: 1 },
      { sort: -1 },
      10,
      Infinity
    )

    expect(storage['test'].find.firstCall.args[0]).to.be.deep.equal({
      search: 0
    })
    const cursor = storage['test'].find.firstCall.returnValue

    expect(cursor.projection.firstCall.args[0]).to.be.deep.equal({
      field: 1,
      _id: 0
    })
    expect(cursor.sort.firstCall.args[0]).to.be.deep.equal({ sort: -1 })
    expect(cursor.skip.firstCall.args[0]).to.be.equal(10)
    expect(cursor.limit.callCount).to.be.equal(0)

    expect(result).to.be.equal(gaugeResultSet)
  })

  it('should provide findOne method - all arguments passed', async () => {
    const gaugeResult = {}
    const storage = makeFindStubStorage('test', gaugeResult)

    const result = await storeApi.findOne(
      { storage },
      'test',
      { search: 0 },
      { field: 1 }
    )

    expect(storage['test'].findOne.firstCall.args[0]).to.be.deep.equal({
      search: 0
    })
    const cursor = storage['test'].findOne.firstCall.returnValue

    expect(cursor.projection.firstCall.args[0]).to.be.deep.equal({
      field: 1,
      _id: 0
    })

    expect(result).to.be.equal(gaugeResult)
  })

  it('should provide findOne method - no projection passed', async () => {
    const gaugeResult = {}
    const storage = makeFindStubStorage('test', gaugeResult)

    const result = await storeApi.findOne({ storage }, 'test', { search: 0 })

    expect(storage['test'].findOne.firstCall.args[0]).to.be.deep.equal({
      search: 0
    })
    const cursor = storage['test'].findOne.firstCall.returnValue

    expect(cursor.projection.firstCall.args[0]).to.be.deep.equal({ _id: 0 })

    expect(result).to.be.equal(gaugeResult)
  })

  it('should provide count method', async () => {
    const gaugeResult = 100
    const storage = {
      test: {
        count: sinon.stub().callsFake((search, cb) => cb(null, gaugeResult))
      }
    }

    const result = await storeApi.count({ storage }, 'test', { search: 0 })

    expect(storage.test.count.firstCall.args[0]).to.be.deep.equal({ search: 0 })

    expect(result).to.be.equal(gaugeResult)
  })

  it('should provide insert method', async () => {
    const storage = {
      test: {
        insert: sinon.stub().callsFake((document, cb) => cb(null))
      }
    }

    await storeApi.insert({ storage }, 'test', { id: 1, value: 2 })

    expect(storage.test.insert.firstCall.args[0]).to.be.deep.equal({
      id: 1,
      value: 2
    })
  })

  it('should provide update method', async () => {
    const storage = {
      test: {
        update: sinon
          .stub()
          .callsFake((searchExpression, updateExpression, cb) => cb(null))
      }
    }

    await storeApi.update(
      { storage },
      'test',
      { id: 1, value: 2 },
      { id: 1, value: 10 }
    )

    expect(storage.test.update.firstCall.args[0]).to.be.deep.equal({
      id: 1,
      value: 2
    })
    expect(storage.test.update.firstCall.args[1]).to.be.deep.equal({
      id: 1,
      value: 10
    })
  })

  it('should provide del method', async () => {
    const storage = {
      test: {
        remove: sinon.stub().callsFake((searchExpression, cb) => cb(null))
      }
    }

    await storeApi.del({ storage }, 'test', { id: 1, value: 2 })

    expect(storage.test.remove.firstCall.args[0]).to.be.deep.equal({
      id: 1,
      value: 2
    })
  })
})
