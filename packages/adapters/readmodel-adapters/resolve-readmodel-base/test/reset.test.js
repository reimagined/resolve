import sinon from 'sinon'

import reset from '../src/reset'

describe('resolve-readmodel-base reset', () => {
  it('should work properly - on first call', async () => {
    const metaApi = {
      disconnect: sinon.stub().callsFake(async () => null),
      drop: sinon.stub().callsFake(async () => null)
    }

    const internalContext = { key: true }
    const disposeOptions = {}
    const disposePromise = reset({ metaApi, internalContext }, disposeOptions)

    expect(disposePromise).toEqual(internalContext.disposePromise)
    expect(Object.keys(internalContext)).toEqual(['disposePromise'])

    await disposePromise

    expect(metaApi.disconnect.callCount).toEqual(1)
    expect(metaApi.drop.firstCall.args[0]).toEqual(disposeOptions)

    expect(metaApi.drop.callCount).toEqual(1)
  })

  it('should not dispose on second and following calls', async () => {
    const disposePromise = Promise.resolve()
    const result = reset({ internalContext: { disposePromise } })

    expect(result).toEqual(disposePromise)

    await disposePromise
  })
})
