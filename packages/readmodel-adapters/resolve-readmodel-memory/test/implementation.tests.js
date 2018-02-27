import { expect } from 'chai'
import sinon from 'sinon'

import implementation from '../src/implementation'

describe('resolve-readmodel-memory implementation', () => {
  it('should work properly', async () => {
    const ownStorage = {}
    const ownMetaInfo = {}
    const metaApi = { metaMethod: sinon.stub().callsFake(() => 10) }
    const storeApi = { storeMethod: sinon.stub().callsFake(() => 20) }
    const createStorage = sinon.stub()

    const result = implementation(metaApi, storeApi, createStorage, {
      metaName: 'META_NAME',
      storage: ownStorage,
      metaInfo: ownMetaInfo
    })

    expect(await result.metaApi.metaMethod()).to.be.equal(10)
    expect(await result.storeApi.storeMethod()).to.be.equal(20)

    const metaMethodCallArg = metaApi.metaMethod.firstCall.args[0]
    expect(metaMethodCallArg.createStorage).to.be.equal(createStorage)
    expect(metaMethodCallArg.metaInfo).to.be.equal(ownMetaInfo)
    expect(metaMethodCallArg.storage).to.be.equal(ownStorage)

    const storeMethodCallArg = storeApi.storeMethod.firstCall.args[0]
    expect(storeMethodCallArg.createStorage).to.be.equal(createStorage)
    expect(storeMethodCallArg.metaInfo).to.be.equal(ownMetaInfo)
    expect(storeMethodCallArg.storage).to.be.equal(ownStorage)
  })
})
