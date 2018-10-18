import sinon from 'sinon'

import createViewModel from '../../src/view-model/create-view-model'

describe('View-model creator should create view-model and bind methods', () => {
  let init, getViewModel, getLastError, read, readAndSerialize, updateByEvents
  let dispose, eventHandler, getKey, projection, eventStore, snapshotAdapter
  let invariantHash, serializeState, deserializeState, repository
  let viewModel, callArg

  afterEach(() => {
    init = null
    getViewModel = null
    getLastError = null
    read = null
    readAndSerialize = null
    updateByEvents = null
    dispose = null
    eventHandler = null
    getKey = null
    projection = null
    eventStore = null
    snapshotAdapter = null
    invariantHash = null
    serializeState = null
    deserializeState = null
    repository = null
    callArg = null
  })

  const checkViewModel = async () => {
    viewModel = createViewModel(
      init,
      getViewModel,
      getLastError,
      read,
      readAndSerialize,
      updateByEvents,
      dispose,
      eventHandler,
      getKey,
      Object.assign(
        {
          projection,
          eventStore,
          serializeState,
          deserializeState
        },
        snapshotAdapter != null ? { snapshotAdapter } : {},
        invariantHash != null ? { invariantHash } : {}
      )
    )

    callArg = {}

    expect(getLastError.callCount).toEqual(0)
    await viewModel.getLastError(callArg)
    expect(getLastError.callCount).toEqual(1)
    expect(getLastError.firstCall.args[1]).toEqual(callArg)

    expect(read.callCount).toEqual(0)
    await viewModel.read(callArg)
    expect(read.callCount).toEqual(1)
    expect(read.firstCall.args[1]).toEqual(callArg)

    expect(readAndSerialize.callCount).toEqual(0)
    await viewModel.readAndSerialize(callArg)
    expect(readAndSerialize.callCount).toEqual(1)
    expect(readAndSerialize.firstCall.args[1]).toEqual(callArg)

    expect(updateByEvents.callCount).toEqual(0)
    await viewModel.updateByEvents(callArg)
    expect(updateByEvents.callCount).toEqual(1)
    expect(updateByEvents.firstCall.args[1]).toEqual(callArg)

    expect(dispose.callCount).toEqual(0)
    await viewModel.dispose(callArg)
    expect(dispose.callCount).toEqual(1)
    expect(dispose.firstCall.args[1]).toEqual(callArg)

    expect(deserializeState.callCount).toEqual(0)
    await viewModel.deserialize(callArg)
    expect(deserializeState.callCount).toEqual(1)
    expect(deserializeState.firstCall.args[0]).toEqual(callArg)

    repository = read.firstCall.args[0]
  }

  beforeEach(async () => {
    init = sinon.stub()
    getViewModel = sinon.stub()
    getLastError = sinon.stub()
    read = sinon.stub()
    readAndSerialize = sinon.stub()
    updateByEvents = sinon.stub()
    dispose = sinon.stub()
    eventHandler = sinon.stub()
    getKey = sinon.stub()

    projection = {
      Init: sinon.stub(),
      EVENT_TYPE_ONE: sinon.stub(),
      EVENT_TYPE_TWO: sinon.stub()
    }
    eventStore = {}
    snapshotAdapter = {}
    invariantHash = 'INVARIANT_VIEW_MODEL_HASH'
    serializeState = sinon.stub()
    deserializeState = sinon.stub()
  })

  test('with invariant hash and with snapshot adapter', async () => {
    await checkViewModel()

    const { viewMap, ...restRepository } = repository
    expect(viewMap).toBeInstanceOf(Map)

    expect(restRepository).toEqual({
      eventTypes: ['EVENT_TYPE_ONE', 'EVENT_TYPE_TWO'],
      projection,
      eventStore,
      snapshotAdapter,
      invariantHash,
      serializeState,
      deserializeState,
      init,
      getViewModel,
      eventHandler,
      getKey,
      read
    })
  })

  test('without invariant hash and without snapshot adapter', async () => {
    invariantHash = null
    snapshotAdapter = null
    await checkViewModel()

    const { viewMap, ...restRepository } = repository
    expect(viewMap).toBeInstanceOf(Map)

    expect(restRepository).toEqual({
      eventTypes: ['EVENT_TYPE_ONE', 'EVENT_TYPE_TWO'],
      projection,
      eventStore,
      snapshotAdapter,
      invariantHash,
      serializeState,
      deserializeState,
      init,
      getViewModel,
      eventHandler,
      getKey,
      read
    })
  })

  test('without invariant hash and with snapshot adapter', async () => {
    invariantHash = null
    try {
      await checkViewModel()
      return Promise.reject('Test failed')
    } catch (error) {
      expect(error).toBeInstanceOf(Error)
      expect(error.message).toEqual(
        `Field 'invariantHash' is mandatory when using view-model snapshots`
      )
    }
  })
})
