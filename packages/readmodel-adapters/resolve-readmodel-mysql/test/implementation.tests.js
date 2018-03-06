import { expect } from 'chai'
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

    const result = implementation(metaApi, storeApi, mysql, {
      metaName: 'META_NAME',
      ...testConnectionOptions
    })

    expect(await result.metaApi.metaMethod()).to.be.equal(10)
    expect(await result.storeApi.storeMethod()).to.be.equal(20)

    expect(mysql.createConnection.firstCall.args[0]).to.be.deep.equal(
      testConnectionOptions
    )

    const metaMethodCallArg = metaApi.metaMethod.firstCall.args[0]
    expect(metaMethodCallArg.connection).to.be.equal(connection)
    expect(metaMethodCallArg.metaName).to.be.equal('META_NAME')

    const storeMethodCallArg = storeApi.storeMethod.firstCall.args[0]
    expect(storeMethodCallArg.connection).to.be.equal(connection)
    expect(storeMethodCallArg.metaName).to.be.equal('META_NAME')

    expect(metaMethodCallArg).to.be.equal(storeMethodCallArg)
    const pool = metaMethodCallArg

    expect(pool.prop).to.be.equal(30)
  })
})
