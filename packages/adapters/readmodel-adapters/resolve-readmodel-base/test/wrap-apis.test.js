import sinon from 'sinon'
import wrapApis from '../src/wrap-apis'

describe('resolve-readmodel-base wrap-apis', () => {
  it('should work properly', async () => {
    let connectionPromise, resolveConnectionPromise

    const implementation = {
      metaApi: {
        connect: sinon.stub().callsFake(() => {
          connectionPromise = new Promise(resolve => {
            resolveConnectionPromise = () => {
              resolve()
              connectionPromise.state = 'resolved'
            }
          })
          connectionPromise.state = 'pending'
          return connectionPromise
        }),
        metaFunc: sinon.stub().callsFake(async () => {})
      },
      storeApi: {
        storeFunc: sinon.stub().callsFake(async () => {})
      }
    }
    const pool = {
      adapterContext: {}
    }
    const options = {
      some: 111,
      opts: 222
    }

    const wrappedImpl = wrapApis(implementation, pool, options)
    expect(connectionPromise).toEqual(undefined)
    expect(pool.connectPromise).toEqual(undefined)

    const metaFuncPromise = wrappedImpl.metaApi.metaFunc(333)
    expect(pool.connectPromise).toBeInstanceOf(Promise)
    const savedConnectPromise = pool.connectPromise

    const storeFuncPromise = wrappedImpl.storeApi.storeFunc(444)
    expect(connectionPromise.state).toEqual('pending')
    expect(pool.connectPromise).toEqual(savedConnectPromise)

    const {
      metaApi: { metaFunc },
      storeApi: { storeFunc }
    } = implementation

    expect(metaFunc.callCount).toEqual(0)
    expect(storeFunc.callCount).toEqual(0)

    resolveConnectionPromise()
    await metaFuncPromise
    await storeFuncPromise
    expect(connectionPromise.state).toEqual('resolved')

    expect(metaFunc.callCount).toEqual(1)
    expect(storeFunc.callCount).toEqual(1)

    expect(metaFunc.firstCall.args[0]).toEqual(pool.adapterContext)
    expect(storeFunc.firstCall.args[0]).toEqual(pool.adapterContext)

    expect(metaFunc.firstCall.args[1]).toEqual(333)
    expect(storeFunc.firstCall.args[1]).toEqual(444)
  })
})
