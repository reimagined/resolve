import { expect } from 'chai'
import sinon from 'sinon'

import init from '../src/init'
import messages from '../src/messages'

describe('resolve-readmodel-base init', () => {
  let storeApi
  beforeEach(() => {
    storeApi = {
      find: sinon.stub(),
      findOne: sinon.stub(),
      count: sinon.stub(),
      mutate: sinon.stub()
    }
  })

  afterEach(() => {
    storeApi = null
  })

  it('should work properly - with custom normal init handler', async () => {
    let currentTimestamp = 0
    const metaApi = {
      getLastTimestamp: sinon.stub().callsFake(async () => currentTimestamp),
      setLastTimestamp: sinon
        .stub()
        .callsFake(async ts => (currentTimestamp = ts))
    }

    const internalContext = {
      initHandler: sinon.stub()
    }

    const { prepareProjection, getReadInterface } = init({
      metaApi,
      storeApi,
      internalContext
    })

    const lastTimestamp = currentTimestamp
    expect(internalContext.initHandler.callCount).to.be.equal(0)
    expect(await prepareProjection()).to.be.equal(lastTimestamp)

    const readInterface = await getReadInterface()
    expect(internalContext.initHandler.callCount).to.be.equal(1)
    expect(readInterface.find).to.be.equal(storeApi.find)
    expect(readInterface.findOne).to.be.equal(storeApi.findOne)
    expect(readInterface.count).to.be.equal(storeApi.count)

    try {
      await readInterface.mutate()
      return Promise.reject(
        'Mutation operator should be rejection on read side'
      )
    } catch (err) {
      expect(err).to.be.instanceOf(Error)
      expect(err.message).to.be.equal(
        messages.readSideForbiddenOperation('mutate')
      )
    }

    expect(internalContext.initHandler.firstCall.args[0]).to.be.equal(storeApi)

    expect(await metaApi.getLastTimestamp.firstCall.returnValue).to.be.equal(0)
    expect(await metaApi.setLastTimestamp.firstCall.args[0]).to.be.equal(1)

    expect(await prepareProjection()).to.be.equal(1)
  })

  it('should work properly - with custom normal init handler on non-zero timestamp', async () => {
    let currentTimestamp = 100
    const metaApi = {
      getLastTimestamp: sinon.stub().callsFake(async () => currentTimestamp),
      setLastTimestamp: sinon
        .stub()
        .callsFake(async ts => (currentTimestamp = ts))
    }
    const internalContext = {
      initHandler: sinon.stub()
    }

    const { prepareProjection, getReadInterface } = init({
      metaApi,
      storeApi,
      internalContext
    })

    const lastTimestamp = currentTimestamp
    expect(internalContext.initHandler.callCount).to.be.equal(0)
    expect(await prepareProjection()).to.be.equal(lastTimestamp)

    const readInterface = await getReadInterface()
    expect(internalContext.initHandler.callCount).to.be.equal(0)
    expect(readInterface.find).to.be.equal(storeApi.find)
    expect(readInterface.findOne).to.be.equal(storeApi.findOne)
    expect(readInterface.count).to.be.equal(storeApi.count)

    try {
      await readInterface.mutate()
      return Promise.reject(
        'Mutation operator should be rejection on read side'
      )
    } catch (err) {
      expect(err).to.be.instanceOf(Error)
      expect(err.message).to.be.equal(
        messages.readSideForbiddenOperation('mutate')
      )
    }

    expect(await metaApi.getLastTimestamp.firstCall.returnValue).to.be.equal(
      100
    )

    expect(await prepareProjection()).to.be.equal(100)
  })

  it('should work properly - with custom failed init handler', async () => {
    let currentTimestamp = 0
    const metaApi = {
      getLastTimestamp: sinon.stub().callsFake(async () => currentTimestamp),
      setLastTimestamp: sinon
        .stub()
        .callsFake(async ts => (currentTimestamp = ts))
    }

    const internalContext = {
      initHandler: sinon.stub().throws('ERR')
    }

    const { prepareProjection } = init({ metaApi, storeApi, internalContext })

    try {
      await prepareProjection()
      return Promise.reject('Init projection error should hoist to invoker')
    } catch (error) {
      expect(error).to.be.instanceOf(Error)
      expect(error.name).to.be.equal('ERR')
    }
  })

  it('should work properly - with default init handler', async () => {
    let currentTimestamp = 0
    const metaApi = {
      getLastTimestamp: sinon.stub().callsFake(async () => currentTimestamp),
      setLastTimestamp: sinon
        .stub()
        .callsFake(async ts => (currentTimestamp = ts))
    }

    const internalContext = {}

    const { prepareProjection, getReadInterface } = init({
      metaApi,
      storeApi,
      internalContext
    })

    expect(internalContext.initHandler).to.be.instanceOf(Function)

    const lastTimestamp = currentTimestamp
    expect(await prepareProjection()).to.be.equal(lastTimestamp)

    const readInterface = await getReadInterface()
    expect(readInterface.find).to.be.equal(storeApi.find)

    try {
      await readInterface.mutate()
      return Promise.reject(
        'Mutation operator should be rejection on read side'
      )
    } catch (err) {
      expect(err).to.be.instanceOf(Error)
      expect(err.message).to.be.equal(
        messages.readSideForbiddenOperation('mutate')
      )
    }

    expect(await metaApi.getLastTimestamp.firstCall.returnValue).to.be.equal(0)
    expect(await metaApi.setLastTimestamp.firstCall.args[0]).to.be.equal(1)

    expect(await prepareProjection()).to.be.equal(1)
  })

  it('should translate meta-api failure to read api functions', async () => {
    const metaApi = { getLastTimestamp: sinon.stub().throws('ERR') }
    const internalContext = {}

    const { prepareProjection } = init({ metaApi, storeApi, internalContext })

    try {
      await prepareProjection()
      return Promise.reject('Meta-level storage error should hoist to invoker')
    } catch (error) {
      expect(error).to.be.instanceOf(Error)
      expect(error.name).to.be.equal('ERR')
    }
  })

  it('should not allow reinitialization', async () => {
    try {
      init({ internalContext: { readInterface: {} } })
      return Promise.reject('Init should not allow reinitialization')
    } catch (err) {
      expect(err).to.be.instanceOf(Error)
      expect(err.message).to.be.equal(messages.alreadyInitialized)
    }
  })
})
