import sinon from 'sinon'

import implementation from '../src/implementation'

describe('resolve-readmodel-mongo implementation', () => {
  let connection, metaApi, storeApi, testConnectionOptions

  beforeEach(() => {
    connection = {}
    metaApi = {
      metaMethod: sinon.stub().callsFake(() => 10),
      getMetaInfo: sinon
        .stub()
        .callsFake(pool => Promise.resolve((pool.prop = 30)))
    }
    storeApi = { storeMethod: sinon.stub().callsFake(() => 20) }

    testConnectionOptions = {
      url: 'url',
      user: 'user',
      password: 'password',
      databaseName: 'databaseName'
    }
  })

  afterEach(() => {
    testConnectionOptions = null
    connection = null
    metaApi = null
    storeApi = null
  })

  it('should work properly on normal connection with connection arguments', async () => {
    const MongoClient = {
      connect: sinon.stub().callsFake(() =>
        Promise.resolve({
          db: sinon.stub().callsFake(() => Promise.resolve(connection))
        })
      )
    }

    const result = implementation(metaApi, storeApi, MongoClient, {
      metaName: 'META_NAME',
      ...testConnectionOptions
    })

    expect(await result.metaApi.metaMethod()).toEqual(10)
    expect(await result.storeApi.storeMethod()).toEqual(20)

    expect(MongoClient.connect.firstCall.args[0]).toEqual(
      testConnectionOptions.url
    )
    const client = await MongoClient.connect.firstCall.returnValue

    expect(client.db.firstCall.args[0]).toEqual(
      testConnectionOptions.databaseName
    )

    const metaMethodCallArg = metaApi.metaMethod.firstCall.args[0]
    expect(metaMethodCallArg.connection).toEqual(connection)
    expect(metaMethodCallArg.metaName).toEqual('META_NAME')

    const storeMethodCallArg = storeApi.storeMethod.firstCall.args[0]
    expect(storeMethodCallArg.connection).toEqual(connection)
    expect(storeMethodCallArg.metaName).toEqual('META_NAME')

    expect(metaMethodCallArg).toEqual(storeMethodCallArg)
    const pool = metaMethodCallArg

    expect(pool.prop).toEqual(30)
  })

  it('should work properly on normal connection with default arguments', async () => {
    const MongoClient = {
      connect: sinon.stub().callsFake(() =>
        Promise.resolve({
          db: sinon.stub().callsFake(() => Promise.resolve(connection))
        })
      )
    }

    const result = implementation(metaApi, storeApi, MongoClient, {
      metaName: 'META_NAME'
    })

    expect(await result.metaApi.metaMethod()).toEqual(10)
    expect(await result.storeApi.storeMethod()).toEqual(20)

    const metaMethodCallArg = metaApi.metaMethod.firstCall.args[0]
    expect(metaMethodCallArg.connection).toEqual(connection)
    expect(metaMethodCallArg.metaName).toEqual('META_NAME')

    const storeMethodCallArg = storeApi.storeMethod.firstCall.args[0]
    expect(storeMethodCallArg.connection).toEqual(connection)
    expect(storeMethodCallArg.metaName).toEqual('META_NAME')

    expect(metaMethodCallArg).toEqual(storeMethodCallArg)
    const pool = metaMethodCallArg

    expect(pool.prop).toEqual(30)
  })

  it('should handle database connection error', async () => {
    const connectionError = new Error()
    const MongoClient = {
      connect: sinon.stub().callsFake(() => Promise.reject(connectionError))
    }

    const result = implementation(metaApi, storeApi, MongoClient, {
      metaName: 'META_NAME',
      ...testConnectionOptions
    })

    try {
      await result.metaApi.metaMethod()
      return Promise.reject('Should handle database connection error')
    } catch (err) {
      expect(err).toEqual(connectionError)
    }
  })

  it('should handle database selection error', async () => {
    const selectionError = new Error()
    const MongoClient = {
      connect: sinon.stub().callsFake(() =>
        Promise.resolve({
          db: sinon.stub().callsFake(() => Promise.reject(selectionError))
        })
      )
    }

    const result = implementation(metaApi, storeApi, MongoClient, {
      metaName: 'META_NAME',
      ...testConnectionOptions
    })

    try {
      await result.metaApi.metaMethod()
      return Promise.reject('Should handle database selection error')
    } catch (err) {
      expect(err).toEqual(selectionError)
    }
  })
})
