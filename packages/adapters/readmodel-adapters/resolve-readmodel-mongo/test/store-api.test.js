import sinon from 'sinon'

import storeApi from '../src/store-api'

describe('resolve-readmodel-mongo store-api', () => {
  const META_NAME = 'META_NAME'

  let collectionApi, pool, db, connection

  beforeEach(() => {
    collectionApi = {
      createIndex: sinon.stub().callsFake(() => Promise.resolve()),
      find: sinon.stub().callsFake(() => Promise.resolve()),
      findOne: sinon.stub().callsFake(() => Promise.resolve()),
      count: sinon.stub().callsFake(() => Promise.resolve()),
      insertOne: sinon.stub().callsFake(() => Promise.resolve()),
      updateMany: sinon.stub().callsFake(() => Promise.resolve()),
      deleteMany: sinon.stub().callsFake(() => Promise.resolve()),
      drop: sinon.stub().callsFake(() => Promise.resolve())
    }

    db = {
      collection: sinon.stub().callsFake(() => Promise.resolve(collectionApi))
    }

    connection = {
      db: sinon.stub().callsFake(async () => db)
    }

    pool = {
      connection,
      metaName: META_NAME
    }
  })

  afterEach(() => {
    collectionApi = null
    connection = null
    pool = null
    db = null
  })

  it('should provide defineTable method', async () => {
    await storeApi.defineTable(pool, 'test', {
      first: 'primary-string',
      second: 'secondary-number',
      third: 'secondary-string',
      normal: 'regular'
    })

    expect(await db.collection.firstCall.returnValue).toEqual(collectionApi)

    expect(collectionApi.createIndex.callCount).toEqual(3)
    expect(collectionApi.createIndex.firstCall.args).toEqual([
      { first: 1 },
      { unique: true }
    ])

    expect(collectionApi.createIndex.secondCall.args).toEqual([{ second: 1 }])

    expect(collectionApi.createIndex.thirdCall.args).toEqual([{ third: 1 }])
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

    expect(await db.collection.firstCall.returnValue).toEqual(collectionApi)

    expect(result).toEqual(resultValue)

    expect(collectionApi.find.firstCall.args).toEqual([
      { search: { $eq: 0, $type: 'double' } },
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

    expect(await db.collection.firstCall.returnValue).toEqual(collectionApi)

    expect(result).toEqual(resultValue)

    expect(collectionApi.find.firstCall.args).toEqual([
      { search: { $eq: 0, $type: 'double' } },
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

    expect(await db.collection.firstCall.returnValue).toEqual(collectionApi)

    expect(result).toEqual(resultValue)

    expect(collectionApi.find.firstCall.args).toEqual([
      { search: { $eq: 0, $type: 'double' } },
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

    expect(await db.collection.firstCall.returnValue).toEqual(collectionApi)

    expect(result).toEqual(resultValue)

    expect(collectionApi.find.firstCall.args).toEqual([
      { search: { $eq: 0, $type: 'double' } },
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

    expect(await db.collection.firstCall.returnValue).toEqual(collectionApi)

    expect(result).toEqual(resultValue)

    expect(collectionApi.find.firstCall.args).toEqual([
      { search: { $eq: 0, $type: 'double' } },
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

    expect(await db.collection.firstCall.returnValue).toEqual(collectionApi)

    expect(result).toEqual(resultValue)

    expect(collectionApi.findOne.firstCall.args).toEqual([
      { search: { $eq: 0, $type: 'double' } },
      { projection: { field: 1, _id: 0 } }
    ])
  })

  it('should provide findOne method - no projection passed', async () => {
    const resultValue = {}
    collectionApi.findOne.onCall(0).callsFake(async () => resultValue)

    const result = await storeApi.findOne(pool, 'test', { search: 0 })

    expect(await db.collection.firstCall.returnValue).toEqual(collectionApi)

    expect(result).toEqual(resultValue)

    expect(collectionApi.findOne.firstCall.args).toEqual([
      { search: { $eq: 0, $type: 'double' } },
      { projection: { _id: 0 } }
    ])
  })

  it('should provide count method', async () => {
    const resultValue = {}
    collectionApi.count.onCall(0).callsFake(async () => resultValue)

    const result = await storeApi.count(pool, 'test', { search: 0 })

    expect(await db.collection.firstCall.returnValue).toEqual(collectionApi)

    expect(result).toEqual(resultValue)
  })

  it('should provide insert method', async () => {
    await storeApi.insert(pool, 'test', { id: 1, value: 2 })

    expect(await db.collection.firstCall.returnValue).toEqual(collectionApi)

    expect(collectionApi.insertOne.firstCall.args).toEqual([
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

    expect(await db.collection.firstCall.returnValue).toEqual(collectionApi)

    expect(collectionApi.updateMany.firstCall.args).toEqual([
      { id: { $eq: 1, $type: 'double' }, value: { $eq: 2, $type: 'double' } },
      { id: 1, value: 10 },
      { upsert: false }
    ])
  })

  it('should provide del method', async () => {
    await storeApi.del(pool, 'test', { id: 1, value: 2 })

    expect(await db.collection.firstCall.returnValue).toEqual(collectionApi)

    expect(collectionApi.deleteMany.firstCall.args).toEqual([
      { id: { $eq: 1, $type: 'double' }, value: { $eq: 2, $type: 'double' } }
    ])
  })
})
