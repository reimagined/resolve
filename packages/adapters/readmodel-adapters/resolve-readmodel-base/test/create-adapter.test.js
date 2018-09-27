import sinon from 'sinon'

import createAdapter from '../src/create-adapter'
import messages from '../src/messages'

describe('resolve-readmodel-base create-adapter', () => {
  let buildProjection, checkStoreApi, checkTableSchema, wrapApis, init, reset

  beforeEach(async () => {
    buildProjection = sinon.stub()
    checkStoreApi = sinon
      .stub()
      .callsFake(({ metaApi, storeApi }) => ({ metaApi, storeApi: {} }))
    checkTableSchema = sinon.stub()
    wrapApis = sinon.stub().callsFake(() => ({ metaApi: {}, storeApi: {} }))
    init = sinon.stub()
    reset = sinon.stub()
  })

  afterEach(async () => {
    buildProjection = null
    checkStoreApi = null
    checkTableSchema = null
    wrapApis = null
    init = null
    reset = null
  })

  it('should work properly - on appropriate storeApi and metaApi', async () => {
    const implementation = {
      metaApi: {
        connect: sinon.stub()
      },
      storeApi: {}
    }

    const options = {
      metaName: 'META_NAME',
      param: { val: 'PARAM' }
    }

    const adapter = createAdapter(
      buildProjection,
      checkStoreApi,
      checkTableSchema,
      wrapApis,
      init,
      reset,
      implementation,
      options
    )

    expect(adapter.buildProjection).toBeInstanceOf(Function)
    expect(adapter.init).toBeInstanceOf(Function)
    expect(adapter.reset).toBeInstanceOf(Function)

    const buildProjectionArg = {}
    expect(buildProjection.callCount).toEqual(0)
    await adapter.buildProjection(buildProjectionArg)
    expect(buildProjection.callCount).toEqual(1)
    expect(buildProjection.firstCall.args[1]).toEqual(buildProjectionArg)

    const initArg = {}
    expect(init.callCount).toEqual(0)
    await adapter.init(initArg)
    expect(init.callCount).toEqual(1)
    expect(init.firstCall.args[1]).toEqual(initArg)

    const resetArg = {}
    expect(reset.callCount).toEqual(0)
    await adapter.reset(resetArg)
    expect(reset.callCount).toEqual(1)
    expect(reset.firstCall.args[1]).toEqual(resetArg)

    const pool = init.firstCall.args[0]
    expect(wrapApis.callCount).toEqual(1)
    expect(wrapApis.firstCall.args[0]).toEqual(implementation)
    expect(wrapApis.firstCall.args[1]).toEqual(pool)

    const mergedOptions = wrapApis.firstCall.args[2]
    expect(mergedOptions.checkStoredTableSchema).toEqual(checkTableSchema)
    expect(mergedOptions.metaName).toEqual('META_NAME')
    expect(mergedOptions.metaName).toEqual('META_NAME')
    expect(mergedOptions.param).toEqual({ val: 'PARAM' })

    expect(pool.metaApi).not.toEqual(implementation.metaApi)
    expect(pool.storeApi).not.toEqual(implementation.storeApi)

    const wrapApisResult = wrapApis.firstCall.returnValue
    expect(pool.metaApi).toEqual(wrapApisResult.metaApi)
    expect(pool.storeApi).not.toEqual(wrapApisResult.storeApi)

    expect(checkStoreApi.callCount).toEqual(1)
    expect(checkStoreApi.firstCall.args[0]).toEqual({
      metaApi: wrapApisResult.metaApi,
      storeApi: wrapApisResult.storeApi
    })

    const checkStoreApiResult = checkStoreApi.firstCall.returnValue
    expect(pool.storeApi).toEqual(checkStoreApiResult)
  })

  it('should throw error - on invalid storeApi and metaApi', async () => {
    const implementation = { metaApi: 11, storeApi: 22 }

    const options = {
      param: { val: 'PARAM' }
    }

    try {
      createAdapter(
        buildProjection,
        checkStoreApi,
        checkTableSchema,
        wrapApis,
        init,
        reset,
        implementation,
        options
      )

      return Promise.reject('Test failed')
    } catch (error) {
      expect(error).toBeInstanceOf(Error)

      expect(error.message).toEqual(messages.invalidApiImplementation)
    }
  })
})
