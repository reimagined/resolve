import { expect } from 'chai'
import sinon from 'sinon'

import buildProjection from '../src/build-projection'

describe('resolve-readmodel-base build-projection', () => {
  it('should work properly', async () => {
    const metaApi = { setLastTimestamp: sinon.stub() }
    const storeApi = {}
    const internalContext = {
      initDonePromise: Promise.resolve(),
      initHandler: null
    }

    const inputProjection = {
      Init: sinon.stub(),
      CorrectEvent: sinon.stub(),
      WrongEvent: sinon.stub().throws('ERR')
    }
    const event = { timestamp: 100 }

    const wrappedProjection = buildProjection(
      { metaApi, storeApi, internalContext },
      inputProjection
    )
    expect(internalContext.initHandler).to.be.equal(inputProjection.Init)

    await wrappedProjection.CorrectEvent(event)
    expect(inputProjection.CorrectEvent.firstCall.args[0]).to.be.equal(storeApi)
    expect(inputProjection.CorrectEvent.firstCall.args[1]).to.be.equal(event)
    expect(metaApi.setLastTimestamp.firstCall.args[0]).to.be.equal(100)

    try {
      await wrappedProjection.WrongEvent(event)
      return Promise.reject('Projection error should hoist')
    } catch (error) {
      expect(error).to.be.instanceof(Error)
      expect(error.name).to.be.equal('ERR')
    }

    expect(inputProjection.WrongEvent.firstCall.args[0]).to.be.equal(storeApi)
    expect(inputProjection.WrongEvent.firstCall.args[1]).to.be.equal(event)
  })
})
