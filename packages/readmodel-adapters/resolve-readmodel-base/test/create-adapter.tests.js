import { expect } from 'chai'
import sinon from 'sinon'

import createAdapter from '../src/create-adapter'
import messages from '../src/messages'

describe('resolve-readmodel-base create-adapter', () => {
  it('should work properly - on apropriate storeApi and metaApi', async () => {
    const [buildProjection, init, reset] = [
      sinon.stub(),
      sinon.stub(),
      sinon.stub()
    ]
    const [storeApi, metaApi, checkedStoreApi] = [{}, {}, {}]
    const implementation = sinon.stub().callsFake(() => ({ storeApi, metaApi }))
    const checkStoreApi = sinon.stub().callsFake(() => checkedStoreApi)
    const options = { metaName: 'META_NAME', param: { val: 'PARAM' } }

    const adapter = createAdapter(
      buildProjection,
      checkStoreApi,
      init,
      reset,
      implementation,
      options
    )

    expect(implementation.callCount).to.be.equal(1)
    expect(implementation.firstCall.args[0].metaName).to.be.equal(
      options.metaName
    )
    expect(implementation.firstCall.args[0].param).to.be.equal(options.param)

    expect(checkStoreApi.callCount).to.be.equal(1)
    expect(checkStoreApi.firstCall.args[0].storeApi).to.be.equal(storeApi)
    expect(checkStoreApi.firstCall.args[0].metaApi).to.be.equal(metaApi)

    expect(buildProjection.callCount).to.be.equal(0)
    adapter.buildProjection()
    expect(buildProjection.callCount).to.be.equal(1)
    expect(buildProjection.firstCall.args[0].storeApi).to.be.equal(
      checkedStoreApi
    )
    expect(buildProjection.firstCall.args[0].metaApi).to.be.equal(metaApi)
    const internalContext = buildProjection.firstCall.args[0].internalContext
    expect(internalContext).to.be.a('object')

    expect(init.callCount).to.be.equal(0)
    adapter.init()
    expect(init.callCount).to.be.equal(1)
    expect(init.firstCall.args[0].internalContext).to.be.equal(internalContext)
    expect(init.firstCall.args[0].storeApi).to.be.equal(checkedStoreApi)
    expect(init.firstCall.args[0].metaApi).to.be.equal(metaApi)

    expect(reset.callCount).to.be.equal(0)
    adapter.reset()
    expect(reset.callCount).to.be.equal(1)
    expect(reset.firstCall.args[0].internalContext).to.be.equal(internalContext)
    expect(reset.firstCall.args[0].storeApi).to.be.equal(checkedStoreApi)
    expect(reset.firstCall.args[0].metaApi).to.be.equal(metaApi)
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
      expect(err).to.be.instanceOf(Error)
      expect(err.message).to.be.equal(messages.invalidApiImplementation)
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
      expect(err).to.be.instanceOf(Error)
      expect(err.message).to.be.equal(messages.invalidApiImplementation)
    }
  })
})
