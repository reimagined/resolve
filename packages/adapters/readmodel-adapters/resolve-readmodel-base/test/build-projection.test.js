import sinon from 'sinon'

import buildProjection from '../src/build-projection'

describe('resolve-readmodel-base build-projection', () => {
  it('should work properly', async () => {
    const metaApi = {
      setLastTimestamp: sinon.stub(),
      setLastAggregateVersion: sinon.stub()
    }
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
    expect(internalContext.initHandler).toEqual(inputProjection.Init)

    await wrappedProjection.CorrectEvent(event)
    expect(inputProjection.CorrectEvent.firstCall.args[0]).toEqual(storeApi)
    expect(inputProjection.CorrectEvent.firstCall.args[1]).toEqual(event)
    expect(metaApi.setLastTimestamp.firstCall.args[0]).toEqual(100)

    try {
      await wrappedProjection.WrongEvent(event)
      return Promise.reject('Projection error should hoist')
    } catch (error) {
      expect(error).toBeInstanceOf(Error)
      expect(error.name).toEqual('ERR')
    }

    expect(inputProjection.WrongEvent.firstCall.args[0]).toEqual(storeApi)
    expect(inputProjection.WrongEvent.firstCall.args[1]).toEqual(event)
  })
})
