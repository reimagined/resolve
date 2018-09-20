import sinon from 'sinon'

import reset from '../src/reset'

describe('resolve-readmodel-base reset', () => {
  it('should work properly - on first call', async () => {
    const disposePromise = Promise.resolve()
    const metaApi = { drop: sinon.stub().callsFake(() => disposePromise) }

    const internalContext = { key: true }
    const result = reset({ metaApi, internalContext }, true)

    expect(result).toEqual(disposePromise)

    expect(Object.keys(internalContext)).toEqual(['disposePromise'])
    expect(metaApi.drop.callCount).toEqual(1)

    await disposePromise
  })

  it('should not dispose on second and following calls', async () => {
    const disposePromise = Promise.resolve()
    const result = reset({ internalContext: { disposePromise } })

    expect(result).toEqual(disposePromise)

    await disposePromise
  })
})
