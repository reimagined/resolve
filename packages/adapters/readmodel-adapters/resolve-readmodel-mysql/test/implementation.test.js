import sinon from 'sinon'

import implementation from '../src/implementation'

describe('resolve-readmodel-mysql implementation', () => {
  it('should work properly', async () => {
    const connection = {}
    const metaApi = {
      metaMethod: sinon.stub().callsFake(() => 10),
      getMetaInfo: sinon
        .stub()
        .callsFake(pool => Promise.resolve((pool.prop = 30)))
    }
    const storeApi = { storeMethod: sinon.stub().callsFake(() => 20) }

    const mysql = {
      createConnection: sinon
        .stub()
        .callsFake(() => Promise.resolve(connection))
    }

    const testConnectionOptions = {
      host: 'h',
      port: 1,
      user: 'u',
      password: 'p',
      database: 'd'
    }

    const result = implementation(metaApi, storeApi, mysql, sinon.stub(), {
      metaName: 'META_NAME',
      ...testConnectionOptions
    })

    expect(await result.metaApi.metaMethod()).toEqual(10)
    expect(await result.storeApi.storeMethod()).toEqual(20)

    expect(mysql.createConnection.firstCall.args[0]).toEqual(
      testConnectionOptions
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
})
