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

    const { getLastAppliedTimestamp, getReadable, getError } = init({
      metaApi,
      storeApi,
      internalContext
    })

    const lastTimestamp = currentTimestamp
    expect(internalContext.initHandler.callCount).to.be.equal(0)
    expect(await getLastAppliedTimestamp()).to.be.equal(lastTimestamp)

    const readInterface = await getReadable()
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

    const lastError = await getError()
    expect(lastError).to.be.equal(null)

    expect(await metaApi.getLastTimestamp.firstCall.returnValue).to.be.equal(0)
    expect(await metaApi.getLastTimestamp.secondCall.returnValue).to.be.equal(0)

    expect(await metaApi.setLastTimestamp.firstCall.args[0]).to.be.equal(1)

    expect(await getLastAppliedTimestamp()).to.be.equal(1)
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

    const { getLastAppliedTimestamp, getReadable, getError } = init({
      metaApi,
      storeApi,
      internalContext
    })

    const lastTimestamp = currentTimestamp
    expect(internalContext.initHandler.callCount).to.be.equal(0)
    expect(await getLastAppliedTimestamp()).to.be.equal(lastTimestamp)

    const readInterface = await getReadable()
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

    const lastError = await getError()
    expect(lastError).to.be.equal(null)

    expect(await metaApi.getLastTimestamp.firstCall.returnValue).to.be.equal(
      100
    )

    expect(await getLastAppliedTimestamp()).to.be.equal(100)
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

    const { getError } = init({
      metaApi,
      storeApi,
      internalContext
    })

    const lastError = await getError()
    expect(lastError).to.be.instanceOf(Error)
    expect(lastError.name).to.be.equal('ERR')
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

    const { getLastAppliedTimestamp, getReadable, getError } = init({
      metaApi,
      storeApi,
      internalContext
    })

    expect(internalContext.initHandler).to.be.instanceOf(Function)

    const lastTimestamp = currentTimestamp
    expect(await getLastAppliedTimestamp()).to.be.equal(lastTimestamp)

    const readInterface = await getReadable()
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

    const lastError = await getError()
    expect(lastError).to.be.equal(null)

    expect(await metaApi.getLastTimestamp.firstCall.returnValue).to.be.equal(0)
    expect(await metaApi.getLastTimestamp.secondCall.returnValue).to.be.equal(0)

    expect(await metaApi.setLastTimestamp.firstCall.args[0]).to.be.equal(1)

    expect(await getLastAppliedTimestamp()).to.be.equal(1)
  })

  it('should translate meta-api failure to read api functions', async () => {
    const metaApi = { getLastTimestamp: sinon.stub().throws('ERR') }

    const internalContext = {}

    const { getReadable, getError } = init({
      metaApi,
      storeApi,
      internalContext
    })

    try {
      await getReadable()
      return Promise.reject(
        'Init should translate meta-api failure to read api function'
      )
    } catch (err) {
      expect(err).to.be.instanceOf(Error)
      expect(err.name).to.be.equal('ERR')
    }

    try {
      await getError()
      return Promise.reject(
        'Init should translate meta-api failure to read api function'
      )
    } catch (err) {
      expect(err).to.be.instanceOf(Error)
      expect(err.name).to.be.equal('ERR')
    }
  })

  it('should not allow reinitialization', async () => {
    try {
      init({ internalContext: { isInitialized: true } })
      return Promise.reject('Init should not allow reinitialization')
    } catch (err) {
      expect(err).to.be.instanceOf(Error)
      expect(err.message).to.be.equal(messages.alreadyInitialized)
    }
  })
})
