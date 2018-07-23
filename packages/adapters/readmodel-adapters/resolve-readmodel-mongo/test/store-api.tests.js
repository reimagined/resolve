import { expect } from 'chai'
import sinon from 'sinon'

import storeApi from '../src/store-api'

describe('resolve-readmodel-mongo store-api', () => {
  const META_NAME = 'META_NAME'

  let collectionApi, pool

  beforeEach(() => {
    collectionApi = {
      createIndex: sinon.stub().callsFake(() => Promise.resolve()),
      find: sinon.stub().callsFake(() => Promise.resolve()),
      findOne: sinon.stub().callsFake(() => Promise.resolve()),
      count: sinon.stub().callsFake(() => Promise.resolve()),
      insert: sinon.stub().callsFake(() => Promise.resolve()),
      update: sinon.stub().callsFake(() => Promise.resolve()),
      remove: sinon.stub().callsFake(() => Promise.resolve()),
      drop: sinon.stub().callsFake(() => Promise.resolve())
    }

    pool = {
      connection: {
        collection: sinon.stub().callsFake(() => Promise.resolve(collectionApi))
      },
      metaName: META_NAME
    }
  })

  afterEach(() => {
    collectionApi = null
    pool = null
  })

  it('should provide defineTable method', async () => {
    await storeApi.defineTable(pool, 'test', {
      first: 'primary-string',
      second: 'secondary-number',
      third: 'secondary-string',
      normal: 'regular'
    })

    expect(await pool.connection.collection.firstCall.returnValue).to.be.equal(
      collectionApi
    )

    expect(collectionApi.createIndex.callCount).to.be.equal(3)
    expect(collectionApi.createIndex.firstCall.args).to.be.deep.equal([
      { first: 1 },
      { unique: true }
    ])

    expect(collectionApi.createIndex.secondCall.args).to.be.deep.equal([
      { second: 1 }
    ])

    expect(collectionApi.createIndex.thirdCall.args).to.be.deep.equal([
      { third: 1 }
    ])
  })

  it('should provide find method - all arguments passed', async () => {
    const resultValue = {}
    collectionApi.find
      .onCall(0)
      .callsFake(async () => ({ toArray: async () => resultValue }))

    const result = await storeApi.find(
      pool,
      'test',
      { search: 0 },
      { field: 1 },
      { sort: -1 },
      10,
      20
    )

    expect(await pool.connection.collection.firstCall.returnValue).to.be.equal(
      collectionApi
    )

    expect(result).to.be.equal(resultValue)

    expect(collectionApi.find.firstCall.args).to.be.deep.equal([
      { search: 0 },
      {
        projection: { field: 1, _id: 0 },
        sort: { sort: -1 },
        skip: 10,
        limit: 20
      }
    ])
  })

  it('should provide find method - no projection passed', async () => {
    const resultValue = {}
    collectionApi.find
      .onCall(0)
      .callsFake(async () => ({ toArray: async () => resultValue }))

    const result = await storeApi.find(
      pool,
      'test',
      { search: 0 },
      null,
      { sort: -1 },
      10,
      20
    )

    expect(await pool.connection.collection.firstCall.returnValue).to.be.equal(
      collectionApi
    )

    expect(result).to.be.equal(resultValue)

    expect(collectionApi.find.firstCall.args).to.be.deep.equal([
      { search: 0 },
      {
        projection: { _id: 0 },
        sort: { sort: -1 },
        skip: 10,
        limit: 20
      }
    ])
  })

  it('should provide find method - no sort passed', async () => {
    const resultValue = {}
    collectionApi.find
      .onCall(0)
      .callsFake(async () => ({ toArray: async () => resultValue }))

    const result = await storeApi.find(
      pool,
      'test',
      { search: 0 },
      { field: 1 },
      null,
      10,
      20
    )

    expect(await pool.connection.collection.firstCall.returnValue).to.be.equal(
      collectionApi
    )

    expect(result).to.be.equal(resultValue)

    expect(collectionApi.find.firstCall.args).to.be.deep.equal([
      { search: 0 },
      {
        projection: { field: 1, _id: 0 },
        skip: 10,
        limit: 20
      }
    ])
  })

  it('should provide find method - no skip passed', async () => {
    const resultValue = {}
    collectionApi.find
      .onCall(0)
      .callsFake(async () => ({ toArray: async () => resultValue }))

    const result = await storeApi.find(
      pool,
      'test',
      { search: 0 },
      { field: 1 },
      { sort: -1 },
      Infinity,
      20
    )

    expect(await pool.connection.collection.firstCall.returnValue).to.be.equal(
      collectionApi
    )

    expect(result).to.be.equal(resultValue)

    expect(collectionApi.find.firstCall.args).to.be.deep.equal([
      { search: 0 },
      {
        projection: { field: 1, _id: 0 },
        sort: { sort: -1 },
        limit: 20
      }
    ])
  })

  it('should provide find method - no limit passed', async () => {
    const resultValue = {}
    collectionApi.find
      .onCall(0)
      .callsFake(async () => ({ toArray: async () => resultValue }))

    const result = await storeApi.find(
      pool,
      'test',
      { search: 0 },
      { field: 1 },
      { sort: -1 },
      10,
      Infinity
    )

    expect(await pool.connection.collection.firstCall.returnValue).to.be.equal(
      collectionApi
    )

    expect(result).to.be.equal(resultValue)

    expect(collectionApi.find.firstCall.args).to.be.deep.equal([
      { search: 0 },
      {
        projection: { field: 1, _id: 0 },
        sort: { sort: -1 },
        skip: 10
      }
    ])
  })

  it('should provide findOne method - all arguments passed', async () => {
    const resultValue = {}
    collectionApi.findOne.onCall(0).callsFake(async () => resultValue)

    const result = await storeApi.findOne(
      pool,
      'test',
      { search: 0 },
      { field: 1 }
    )

    expect(await pool.connection.collection.firstCall.returnValue).to.be.equal(
      collectionApi
    )

    expect(result).to.be.equal(resultValue)

    expect(collectionApi.findOne.firstCall.args).to.be.deep.equal([
      { search: 0 },
      { projection: { field: 1, _id: 0 } }
    ])
  })

  it('should provide findOne method - no projection passed', async () => {
    const resultValue = {}
    collectionApi.findOne.onCall(0).callsFake(async () => resultValue)

    const result = await storeApi.findOne(pool, 'test', { search: 0 })

    expect(await pool.connection.collection.firstCall.returnValue).to.be.equal(
      collectionApi
    )

    expect(result).to.be.equal(resultValue)

    expect(collectionApi.findOne.firstCall.args).to.be.deep.equal([
      { search: 0 },
      { projection: { _id: 0 } }
    ])
  })

  it('should provide count method', async () => {
    const resultValue = {}
    collectionApi.count.onCall(0).callsFake(async () => resultValue)

    const result = await storeApi.count(pool, 'test', { search: 0 })

    expect(await pool.connection.collection.firstCall.returnValue).to.be.equal(
      collectionApi
    )

    expect(result).to.be.equal(resultValue)
  })

  it('should provide insert method', async () => {
    await storeApi.insert(pool, 'test', { id: 1, value: 2 })

    expect(await pool.connection.collection.firstCall.returnValue).to.be.equal(
      collectionApi
    )

    expect(collectionApi.insert.firstCall.args).to.be.deep.equal([
      { id: 1, value: 2 }
    ])
  })

  it('should provide update method', async () => {
    await storeApi.update(
      pool,
      'test',
      { id: 1, value: 2 },
      { id: 1, value: 10 },
      { upsert: false }
    )

    expect(await pool.connection.collection.firstCall.returnValue).to.be.equal(
      collectionApi
    )

    expect(collectionApi.update.firstCall.args).to.be.deep.equal([
      { id: 1, value: 2 },
      { id: 1, value: 10 },
      { multi: true, upsert: false }
    ])
  })

  it('should provide del method', async () => {
    await storeApi.del(pool, 'test', { id: 1, value: 2 })

    expect(await pool.connection.collection.firstCall.returnValue).to.be.equal(
      collectionApi
    )

    expect(collectionApi.remove.firstCall.args).to.be.deep.equal([
      { id: 1, value: 2 },
      { multi: true }
    ])
  })
})
