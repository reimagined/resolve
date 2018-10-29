import sinon from 'sinon'

import createReadModel from '../../src/read-model/create-read-model'

describe('Read-model creator should create read-model and bind methods', () => {
  let builtProjection, init, getModelReadInterface, getLastError, read
  let readAndSerialize, updateByEvents, resolverNames, dispose
  let projectionInvoker, deserialize, adapter, projection, eventStore
  let resolvers, readModel, callArg, repository

  afterEach(() => {
    builtProjection = null
    init = null
    getModelReadInterface = null
    getLastError = null
    read = null
    readAndSerialize = null
    updateByEvents = null
    resolverNames = null
    dispose = null
    projectionInvoker = null
    deserialize = null
    adapter = null
    projection = null
    eventStore = null
    resolvers = null
    readModel = null
    callArg = null
    repository = null
  })

  const checkReadModel = async () => {
    readModel = createReadModel(
      init,
      getModelReadInterface,
      getLastError,
      read,
      readAndSerialize,
      updateByEvents,
      resolverNames,
      dispose,
      projectionInvoker,
      deserialize,
      { adapter, projection, eventStore, resolvers }
    )

    callArg = {}

    expect(getModelReadInterface.callCount).toEqual(0)
    await readModel.getReadInterface(callArg)
    expect(getModelReadInterface.callCount).toEqual(1)
    expect(getModelReadInterface.firstCall.args[1]).toEqual(callArg)

    expect(getLastError.callCount).toEqual(0)
    await readModel.getLastError(callArg)
    expect(getLastError.callCount).toEqual(1)
    expect(getLastError.firstCall.args[1]).toEqual(callArg)

    expect(read.callCount).toEqual(0)
    await readModel.read(callArg)
    expect(read.callCount).toEqual(1)
    expect(read.firstCall.args[1]).toEqual(callArg)

    expect(readAndSerialize.callCount).toEqual(0)
    await readModel.readAndSerialize(callArg)
    expect(readAndSerialize.callCount).toEqual(1)
    expect(readAndSerialize.firstCall.args[1]).toEqual(callArg)

    expect(updateByEvents.callCount).toEqual(0)
    await readModel.updateByEvents(callArg)
    expect(updateByEvents.callCount).toEqual(1)
    expect(updateByEvents.firstCall.args[1]).toEqual(callArg)

    expect(resolverNames.callCount).toEqual(0)
    await readModel.resolverNames(callArg)
    expect(resolverNames.callCount).toEqual(1)
    expect(resolverNames.firstCall.args[1]).toEqual(callArg)

    expect(dispose.callCount).toEqual(0)
    await readModel.dispose(callArg)
    expect(dispose.callCount).toEqual(1)
    expect(dispose.firstCall.args[1]).toEqual(callArg)

    expect(deserialize.callCount).toEqual(0)
    await readModel.deserialize(callArg)
    expect(deserialize.callCount).toEqual(1)
    expect(deserialize.firstCall.args[0]).toEqual(callArg)

    repository = getModelReadInterface.firstCall.args[0]
  }

  beforeEach(async () => {
    builtProjection = {}
    init = sinon.stub()
    getModelReadInterface = sinon.stub()
    getLastError = sinon.stub()
    read = sinon.stub()
    readAndSerialize = sinon.stub()
    updateByEvents = sinon.stub()
    resolverNames = sinon.stub()
    dispose = sinon.stub()
    projectionInvoker = sinon.stub()
    deserialize = sinon.stub()
    adapter = {
      buildProjection: sinon.stub().callsFake(() => builtProjection)
    }
    eventStore = {}
  })

  test('with projection and resolvers', async () => {
    resolvers = {}
    projection = {}
    await checkReadModel()

    expect(adapter.buildProjection.callCount).toEqual(1)
    expect(adapter.buildProjection.firstCall.args[0]).toEqual(projection)

    expect(repository).toEqual({
      projection: builtProjection,
      resolvers,
      adapter,
      eventStore,
      init,
      getModelReadInterface,
      projectionInvoker,
      read
    })
  })

  test('without projection and resolvers', async () => {
    resolvers = null
    projection = null
    await checkReadModel()

    expect(adapter.buildProjection.callCount).toEqual(0)

    expect(repository).toEqual({
      projection,
      resolvers: {},
      adapter,
      eventStore,
      init,
      getModelReadInterface,
      projectionInvoker,
      read
    })
  })
})
