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

  // eslint-disable-next-line max-len
  it('Regression test. Pool should be contain .connectPromise after .reset(pool) [To many connection]', async () => {
    const metaApi = {
      disconnect: sinon.stub().callsFake(async () => null),
      drop: sinon.stub().callsFake(async () => null)
    }

    const connectPromise = Promise.resolve()

    const pool = { internalContext: {}, connectPromise, metaApi }

    await reset(pool)

    expect(pool).toMatchObject({
      connectPromise
    })
  })
})
