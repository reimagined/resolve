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
    expect(internalContext.initHandler.callCount).toEqual(0)
    expect(await prepareProjection()).toEqual(lastTimestamp)

    const readInterface = await getReadInterface()
    expect(internalContext.initHandler.callCount).toEqual(1)
    expect(readInterface.find).toEqual(storeApi.find)
    expect(readInterface.findOne).toEqual(storeApi.findOne)
    expect(readInterface.count).toEqual(storeApi.count)

    try {
      await readInterface.mutate()
      return Promise.reject(
        'Mutation operator should be rejection on read side'
      )
    } catch (err) {
      expect(err).toBeInstanceOf(Error)
      expect(err.message).toEqual(messages.readSideForbiddenOperation('mutate'))
    }

    expect(internalContext.initHandler.firstCall.args[0]).toEqual(storeApi)

    expect(await metaApi.getLastTimestamp.firstCall.returnValue).toEqual(0)
    expect(await metaApi.setLastTimestamp.firstCall.args[0]).toEqual(1)

    expect(await prepareProjection()).toEqual(1)
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
    expect(internalContext.initHandler.callCount).toEqual(0)
    expect(await prepareProjection()).toEqual(lastTimestamp)

    const readInterface = await getReadInterface()
    expect(internalContext.initHandler.callCount).toEqual(0)
    expect(readInterface.find).toEqual(storeApi.find)
    expect(readInterface.findOne).toEqual(storeApi.findOne)
    expect(readInterface.count).toEqual(storeApi.count)

    try {
      await readInterface.mutate()
      return Promise.reject(
        'Mutation operator should be rejection on read side'
      )
    } catch (err) {
      expect(err).toBeInstanceOf(Error)
      expect(err.message).toEqual(messages.readSideForbiddenOperation('mutate'))
    }

    expect(await metaApi.getLastTimestamp.firstCall.returnValue).toEqual(100)

    expect(await prepareProjection()).toEqual(100)
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
      expect(error).toBeInstanceOf(Error)
      expect(error.name).toEqual('ERR')
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

    expect(internalContext.initHandler).toBeInstanceOf(Function)

    const lastTimestamp = currentTimestamp
    expect(await prepareProjection()).toEqual(lastTimestamp)

    const readInterface = await getReadInterface()
    expect(readInterface.find).toEqual(storeApi.find)

    try {
      await readInterface.mutate()
      return Promise.reject(
        'Mutation operator should be rejection on read side'
      )
    } catch (err) {
      expect(err).toBeInstanceOf(Error)
      expect(err.message).toEqual(messages.readSideForbiddenOperation('mutate'))
    }

    expect(await metaApi.getLastTimestamp.firstCall.returnValue).toEqual(0)
    expect(await metaApi.setLastTimestamp.firstCall.args[0]).toEqual(1)

    expect(await prepareProjection()).toEqual(1)
  })

  it('should translate meta-api failure to read api functions', async () => {
    const metaApi = { getLastTimestamp: sinon.stub().throws('ERR') }
    const internalContext = {}

    const { prepareProjection } = init({ metaApi, storeApi, internalContext })

    try {
      await prepareProjection()
      return Promise.reject('Meta-level storage error should hoist to invoker')
    } catch (error) {
      expect(error).toBeInstanceOf(Error)
      expect(error.name).toEqual('ERR')
    }
  })

  it('should not allow reinitialization', async () => {
    try {
      init({ internalContext: { readInterface: {} } })
      return Promise.reject('Init should not allow reinitialization')
    } catch (err) {
      expect(err).toBeInstanceOf(Error)
      expect(err.message).toEqual(messages.alreadyInitialized)
    }
  })
})
