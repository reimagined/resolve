import { expect } from 'chai'
import sinon from 'sinon'

import createFacade from '../src/facade'

describe('resolve-query facade', () => {
  let resolvers, model, readStore

  beforeEach(() => {
    readStore = {}
    resolvers = {
      GoodResolver: sinon.stub().callsFake(async store => store),
      BadResolver: true
    }
    model = {
      read: sinon.stub().callsFake(async () => readStore),
      addEventListener: sinon.stub(),
      removeEventListener: sinon.stub(),
      dispose: sinon.stub()
    }
  })

  afterEach(() => {
    readStore = null
    resolvers = null
    model = null
  })

  it('should handle good facade resolvers', async () => {
    const facade = createFacade({ resolvers, model })
    const resolverArgument = {}
    const readerArgument = {}

    await facade.executeQuery('GoodResolver', resolverArgument, readerArgument)
    const resolverArgs = resolvers.GoodResolver.firstCall.args

    expect(resolverArgs[0]).to.be.equal(readStore)
    expect(resolverArgs[1]).to.be.equal(resolverArgument)

    const readerArgs = model.read.firstCall.args
    expect(readerArgs[0]).to.be.equal(readerArgument)
  })

  it('should handle bad facade resolvers', async () => {
    const facade = createFacade({ resolvers, model })
    try {
      await facade.executeQuery('BadResolver')
      return Promise.reject('should handle bad facade resolvers')
    } catch (err) {
      expect(err).to.be.instanceOf(Error)
      expect(err.message).to.be.equal(
        `The 'BadResolver' resolver is not specified or not function`
      )
    }
  })

  it('should handle unexisting facade resolvers', async () => {
    const facade = createFacade({ resolvers, model })
    try {
      await facade.executeQuery('UnexistingResolver')
      return Promise.reject('should handle unexisting facade resolvers')
    } catch (err) {
      expect(err).to.be.instanceOf(Error)
      expect(err.message).to.be.equal(
        `The 'UnexistingResolver' resolver is not specified or not function`
      )
    }
  })

  it('should provide reactive reader with correct handler', async () => {
    const facade = createFacade({ resolvers, model })
    const diffsList = []
    const resolverArgument = {}
    const readerArgument = {}
    const publisher = sinon.stub().callsFake(async diff => diffsList.push(diff))

    const reactiveReader = await facade.makeReactiveReader(
      publisher,
      'GoodResolver',
      resolverArgument,
      readerArgument
    )

    const resolverArgs = resolvers.GoodResolver.firstCall.args

    expect(resolverArgs[0]).to.be.equal(readStore)
    expect(resolverArgs[1]).to.be.equal(resolverArgument)

    const readerArgs = model.read.firstCall.args
    expect(readerArgs[0]).to.be.equal(readerArgument)

    expect(reactiveReader.result).to.be.equal(readStore)
    expect(model.addEventListener.callCount).to.be.equal(1)
    expect(model.removeEventListener.callCount).to.be.equal(0)

    reactiveReader.forceStop()

    expect(model.addEventListener.callCount).to.be.equal(1)
    expect(model.removeEventListener.callCount).to.be.equal(1)
  })

  it('should provide reactive reader wrong event handler', async () => {
    const facade = createFacade({ resolvers, model })

    try {
      await facade.makeReactiveReader(null, 'GoodResolver')
      return Promise.reject(
        'should provide reactive reader wrong event handler'
      )
    } catch (err) {
      expect(err).to.be.instanceOf(Error)
      expect(err.message).to.be.equal(
        'Publisher should be callback function (diff: Object) => void'
      )
    }
  })

  it('should provide raw reader', async () => {
    const facade = createFacade({ resolvers, model })
    const resolverArgument = {}

    await facade.executeQueryRaw(resolverArgument)
    const readerArgs = model.read.firstCall.args

    expect(readerArgs[0]).to.be.equal(resolverArgument)
  })

  it('should provide dispose function', async () => {
    const facade = createFacade({ resolvers, model })
    await facade.dispose()

    expect(model.dispose.callCount).to.be.equal(1)
  })
})
