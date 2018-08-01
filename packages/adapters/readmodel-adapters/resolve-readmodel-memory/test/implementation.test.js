import sinon from 'sinon'

import implementation from '../src/implementation'

describe('resolve-readmodel-memory implementation', () => {
  it('should work properly', async () => {
    const ownStorage = {}
    const ownMetaInfo = {}
    const metaApi = { metaMethod: sinon.stub().callsFake(() => 10) }
    const storeApi = { storeMethod: sinon.stub().callsFake(() => 20) }
    const createTable = sinon.stub()

    const result = implementation(metaApi, storeApi, createTable, {
      metaName: 'META_NAME',
      storage: ownStorage,
      metaInfo: ownMetaInfo
    })

    expect(await result.metaApi.metaMethod()).toEqual(10)
    expect(await result.storeApi.storeMethod()).toEqual(20)

    const metaMethodCallArg = metaApi.metaMethod.firstCall.args[0]
    expect(metaMethodCallArg.createTable).toEqual(createTable)
    expect(metaMethodCallArg.metaInfo).toEqual(ownMetaInfo)
    expect(metaMethodCallArg.storage).toEqual(ownStorage)

    const storeMethodCallArg = storeApi.storeMethod.firstCall.args[0]
    expect(storeMethodCallArg.createTable).toEqual(createTable)
    expect(storeMethodCallArg.metaInfo).toEqual(ownMetaInfo)
    expect(storeMethodCallArg.storage).toEqual(ownStorage)
  })
})
