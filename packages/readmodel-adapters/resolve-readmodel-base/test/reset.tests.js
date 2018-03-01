import { expect } from 'chai'
import sinon from 'sinon'

import reset from '../src/reset'

describe('resolve-readmodel-base reset', () => {
  it('should work properly - on first call', async () => {
    const disposePromise = Promise.resolve()
    const metaApi = { drop: sinon.stub().callsFake(() => disposePromise) }

    const internalContext = { key: true }
    const result = reset({ metaApi, internalContext })

    expect(result).to.be.equal(disposePromise)

    expect(Object.keys(internalContext)).to.be.deep.equal(['disposePromise'])
    expect(metaApi.drop.callCount).to.be.equal(1)

    await disposePromise
  })

  it('should dont dispose on second and following calls', async () => {
    const disposePromise = Promise.resolve()
    const result = reset({ internalContext: { disposePromise } })

    expect(result).to.be.equal(disposePromise)

    await disposePromise
  })
})
