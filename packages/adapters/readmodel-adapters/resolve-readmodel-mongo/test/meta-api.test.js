import sinon from 'sinon'

import metaApi from '../src/meta-api'

describe('resolve-readmodel-mongo meta-api', () => {
  const META_NAME = 'META_NAME'

  let collectionApi, pool, db, connection, checkStoredTableSchema

  beforeEach(() => {
    checkStoredTableSchema = sinon.stub()
    collectionApi = {
      createIndex: sinon.stub().callsFake(() => Promise.resolve()),
      find: sinon.stub().callsFake(() => Promise.resolve()),
      findOne: sinon.stub().callsFake(() => Promise.resolve()),
      count: sinon.stub().callsFake(() => Promise.resolve()),
      insertOne: sinon.stub().callsFake(() => Promise.resolve()),
      updateOne: sinon.stub().callsFake(() => Promise.resolve()),
      deleteMany: sinon.stub().callsFake(() => Promise.resolve()),
      drop: sinon.stub().callsFake(() => Promise.resolve())
    }

    db = {
      createCollection: sinon.stub().callsFake(async () => null),
      collection: sinon.stub().callsFake(async () => collectionApi),
      collections: sinon.stub().callsFake(async () => [])
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
    checkStoredTableSchema = null
    collectionApi = null
    connection = null
    pool = null
    db = null
  })

  it('should provide connect method - for initialized meta table', async () => {
    const tableDeclarations = [
      {
        tableName: 'table1',
        tableDescription: {
          id: 'primary-string',
          vol: 'secondary-number',
          content: 'regular'
        }
      },
      {
        tableName: 'table2',
        tableDescription: {
          id: 'primary-string',
          vol: 'secondary-number',
          content: 'regular'
        }
      }
    ]

    collectionApi.findOne.onCall(0).callsFake(async () => ({ timestamp: 100 }))
    collectionApi.find.onCall(0).callsFake(async () => ({
      toArray: async () => []
    }))
    collectionApi.find.onCall(1).callsFake(async () => ({
      toArray: async () => tableDeclarations
    }))

    checkStoredTableSchema.onCall(0).callsFake(() => true)
    checkStoredTableSchema.onCall(1).callsFake(() => true)

    await metaApi.connect(
      { connect: async () => connection },
      pool,
      { checkStoredTableSchema }
    )
    expect(pool.metaInfo.tables['table1']).toEqual(
      tableDeclarations[0].tableDescription
    )
    expect(pool.metaInfo.tables['table2']).toEqual(
      tableDeclarations[1].tableDescription
    )
    expect(pool.metaInfo.timestamp).toEqual(100)

    expect(collectionApi.findOne.firstCall.args[0]).toEqual({
      key: 'timestamp'
    })

    expect(collectionApi.find.secondCall.args[0]).toEqual({
      key: 'tableDescription'
    })
  })

  it('should provide connect method - for empty meta table', async () => {
    collectionApi.findOne.onCall(0).callsFake(async () => null)
    collectionApi.find.onCall(0).callsFake(async () => ({
      toArray: async () => []
    }))
    collectionApi.find.onCall(1).callsFake(async () => ({
      toArray: async () => []
    }))

    checkStoredTableSchema.onCall(0).callsFake(() => false)
    checkStoredTableSchema.onCall(1).callsFake(() => false)

    await metaApi.connect(
      { connect: async () => connection },
      pool,
      { checkStoredTableSchema }
    )
    expect(pool.metaInfo.tables).toEqual({})
    expect(pool.metaInfo.timestamp).toEqual(0)

    expect(collectionApi.findOne.firstCall.args[0]).toEqual({
      key: 'timestamp'
    })

    expect(collectionApi.find.secondCall.args[0]).toEqual({
      key: 'tableDescription'
    })

    expect(collectionApi.updateOne.firstCall.args).toEqual([
      { key: 'timestamp' },
      { $set: { key: 'timestamp', timestamp: 0 } },
      { upsert: true }
    ])
  })

  it('should provide connect method - for malformed meta table', async () => {
    const tableDeclarations = [
      {
        tableName: 'table',
        tableDescription: {
          field: 'error'
        }
      }
    ]

    collectionApi.findOne
      .onCall(0)
      .callsFake(async () => ({ timestamp: Number.NaN }))

    collectionApi.find.onCall(0).callsFake(async () => ({
      toArray: async () => []
    }))

    collectionApi.find.onCall(1).callsFake(async () => ({
      toArray: async () => tableDeclarations
    }))

    checkStoredTableSchema.onCall(0).callsFake(() => false)
    checkStoredTableSchema.onCall(1).callsFake(() => false)

    await metaApi.connect(
      { connect: async () => connection },
      pool,
      { checkStoredTableSchema }
    )
    expect(pool.metaInfo.tables).toEqual({})
    expect(pool.metaInfo.timestamp).toEqual(0)

    expect(collectionApi.findOne.firstCall.args[0]).toEqual({
      key: 'timestamp'
    })

    expect(collectionApi.find.secondCall.args[0]).toEqual({
      key: 'tableDescription'
    })

    expect(collectionApi.updateOne.firstCall.args).toEqual([
      { key: 'timestamp' },
      { $set: { key: 'timestamp', timestamp: 0 } },
      { upsert: true }
    ])

    expect(collectionApi.deleteMany.firstCall.args[0]).toEqual({
      key: 'tableDescription',
      tableName: tableDeclarations[0].tableName
    })
  })

  it('should provide getLastTimestamp method', async () => {
    pool = { metaInfo: { timestamp: 10 } }

    const result = await metaApi.getLastTimestamp(pool)

    expect(result).toEqual(10)
  })

  it('should provide setLastTimestamp method', async () => {
    pool.metaInfo = { timestamp: 10 }

    await metaApi.setLastTimestamp(pool, 20)
    expect(collectionApi.updateOne.firstCall.args).toEqual([
      { key: 'timestamp' },
      { $set: { key: 'timestamp', timestamp: 20 } }
    ])

    expect(pool.metaInfo.timestamp).toEqual(20)
  })

  it('should provide tableExists method', async () => {
    pool = { metaInfo: { tables: { one: {} } } }

    let result = await metaApi.tableExists(pool, 'one')
    expect(result).toEqual(true)

    result = await metaApi.tableExists(pool, 'two')
    expect(result).toEqual(false)
  })

  it('should provide getTableInfo method', async () => {
    const metaInfoOne = {}
    pool = { metaInfo: { tables: { one: metaInfoOne } } }

    const result = await metaApi.getTableInfo(pool, 'one')

    expect(result).toEqual(metaInfoOne)
  })

  it('should provide describeTable method', async () => {
    pool.metaInfo = { tables: {} }
    const metaInfoOne = {}

    await metaApi.describeTable(pool, 'one', metaInfoOne)
    expect(pool.metaInfo.tables['one']).toEqual(metaInfoOne)

    expect(collectionApi.insertOne.firstCall.args[0]).toEqual({
      key: 'tableDescription',
      tableName: 'one',
      tableDescription: metaInfoOne
    })
  })

  it('should provide getTableNames method', async () => {
    pool.metaInfo = { tables: { one: {}, two: {} } }

    const result = await metaApi.getTableNames(pool)

    expect(result).toEqual(['one', 'two'])
  })

  it('should provide drop method with default arguments', async () => {
    pool.metaInfo = { tables: { one: {}, two: {} } }

    await metaApi.drop(pool)
  })

  it('should provide drop method with custom arguments', async () => {
    pool.metaInfo = { tables: { one: {}, two: {} } }

    await metaApi.drop(pool, { dropDataTables: true, dropMetaTable: true })

    expect(collectionApi.drop.callCount).toEqual(3)

    expect(db.collection.callCount).toEqual(3)
    expect(db.collection.firstCall.args[0]).toEqual('one')
    expect(db.collection.secondCall.args[0]).toEqual('two')
    expect(db.collection.thirdCall.args[0]).toEqual(META_NAME)

    expect(Object.keys(pool.metaInfo)).toEqual([])
  })
})
