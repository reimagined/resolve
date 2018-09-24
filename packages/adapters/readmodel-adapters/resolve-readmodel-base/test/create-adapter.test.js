import sinon from 'sinon'

import createAdapter from '../src/create-adapter'
import messages from '../src/messages'

describe('resolve-readmodel-base create-adapter', () => {
  it('should work properly - on appropriate storeApi and metaApi', async () => {
    const [buildProjection, init, reset] = [
      sinon.stub(),
      sinon.stub(),
      sinon.stub()
    ]
    const [storeApi, metaApi, checkedStoreApi] = [{}, {}, {}]
    metaApi.connect = sinon.stub().callsFake(async () => null)
    const checkStoreApi = sinon.stub().callsFake(() => checkedStoreApi)
    const options = { metaName: 'META_NAME', param: { val: 'PARAM' } }

    const adapter = createAdapter(
      buildProjection,
      checkStoreApi,
      init,
      reset,
      { storeApi, metaApi },
      options
    )

    expect(buildProjection.callCount).toEqual(0)
    adapter.buildProjection()
    expect(buildProjection.callCount).toEqual(1)
    const pool = buildProjection.firstCall.args[0]

    expect(buildProjection.firstCall.args[0].storeApi).toEqual(checkedStoreApi)
    expect(buildProjection.firstCall.args[0].metaApi).toEqual(pool.metaApi)

    const internalContext = buildProjection.firstCall.args[0].internalContext
    expect(internalContext).toEqual({})

    expect(checkStoreApi.callCount).toEqual(1)
    expect(checkStoreApi.firstCall.args[0].storeApi).toEqual(pool.storeApi)
    expect(checkStoreApi.firstCall.args[0].metaApi).toEqual(pool.metaApi)

    expect(init.callCount).toEqual(0)
    adapter.init()
    expect(init.callCount).toEqual(1)
    expect(init.firstCall.args[0].internalContext).toEqual(internalContext)
    expect(init.firstCall.args[0].storeApi).toEqual(checkedStoreApi)
    expect(init.firstCall.args[0].metaApi).toEqual(pool.metaApi)

    expect(reset.callCount).toEqual(0)
    adapter.reset()
    expect(reset.callCount).toEqual(1)
    expect(reset.firstCall.args[0].internalContext).toEqual(internalContext)
    expect(reset.firstCall.args[0].storeApi).toEqual(checkedStoreApi)
    expect(reset.firstCall.args[0].metaApi).toEqual(pool.metaApi)
  })

  it('should throw error - on invalid storeApi and metaApi', async () => {
    const implementation = sinon.stub()
    implementation
      .onCall(0)
      .callsFake(() => ({ metaApi: null, storeApi: null }))
    implementation.onCall(1).callsFake(() => null)

    try {
      createAdapter(
        sinon.stub(),
        sinon.stub(),
        sinon.stub(),
        sinon.stub(),
        implementation,
        {}
      )
      return Promise.reject(
        'Adapter creation should fail on invalid storeApi and metaApi'
      )
    } catch (err) {
      expect(err).toBeInstanceOf(Error)
      expect(err.message).toEqual(messages.invalidApiImplementation)
    }

    try {
      createAdapter(
        sinon.stub(),
        sinon.stub(),
        sinon.stub(),
        sinon.stub(),
        implementation,
        {}
      )
      return Promise.reject(
        'Adapter creation should fail on invalid storeApi and metaApi'
      )
    } catch (err) {
      expect(err).toBeInstanceOf(Error)
      expect(err.message).toEqual(messages.invalidApiImplementation)
    }
  })
})
