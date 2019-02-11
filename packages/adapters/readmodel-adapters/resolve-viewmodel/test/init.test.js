import sinon from 'sinon'

import init from '../src/init'

// eslint-disable-next-line max-len
test('View-model init should init view-model with default state without snapshot adapter', async () => {
  const eventHandler = sinon.stub().callsFake(async () => null)
  const aggregateIds = ['a', 'b', 'c', 'd']
  const eventStore = {
    loadEvents: sinon.stub().callsFake(() => null)
  }
  const projection = {
    EVENT_TYPE_ONE: sinon.stub().callsFake(() => null),
    EVENT_TYPE_TWO: sinon.stub().callsFake(() => null)
  }
  const callArg = {}

  const pool = {
    eventTypes: ['EVENT_TYPE_ONE', 'EVENT_TYPE_TWO'],
    deserializeState: sinon.stub(),
    snapshotAdapter: null,
    invariantHash: null,
    projection,
    eventStore,
    eventHandler
  }

  const viewModel = await init(pool, aggregateIds, 'KEY')

  const {
    aggregatesVersionsMap,
    handler: boundHandler,
    ...restViewModel
  } = viewModel

  expect(aggregatesVersionsMap).toBeInstanceOf(Map)
  expect(eventHandler.callCount).toEqual(0)
  await boundHandler(callArg)
  expect(eventHandler.callCount).toEqual(1)
  expect(eventHandler.firstCall.args[0]).toEqual(pool)
  expect(eventHandler.firstCall.args[1]).toEqual(viewModel)
  expect(eventHandler.firstCall.args[2]).toEqual(callArg)

  expect(restViewModel).toEqual({
    lastTimestamp: -1,
    state: null,
    disposed: false,
    aggregateIds,
    snapshotKey: 'null;KEY',
    key: 'KEY'
  })

  expect(eventStore.loadEvents.callCount).toEqual(1)

  expect(eventStore.loadEvents.firstCall.args[0]).toEqual({
    eventTypes: pool.eventTypes,
    aggregateIds: viewModel.aggregateIds,
    startTime: viewModel.lastTimestamp,
    skipBus: true
  })

  expect(eventStore.loadEvents.firstCall.args[1]).toEqual(boundHandler)

  expect(viewModel.hasOwnProperty('initPromise')).toEqual(false)
})

// eslint-disable-next-line max-len
test('View-model init should init view-model with default state with snapshot adapter', async () => {
  const eventHandler = sinon.stub().callsFake(async () => null)
  const aggregateIds = '*'

  const savedAggregatesVersionsMap = [['root-id', 123]]
  const savedLastTimestamp = 100500
  const savedState = 'SAVED_STATE'

  const snapshotAdapter = {
    loadSnapshot: sinon.stub().callsFake(async () => ({
      aggregatesVersionsMap: savedAggregatesVersionsMap,
      lastTimestamp: savedLastTimestamp,
      state: savedState
    }))
  }
  const eventStore = {
    loadEvents: sinon.stub().callsFake(() => null)
  }
  const projection = {
    EVENT_TYPE_ONE: sinon.stub().callsFake(() => null),
    EVENT_TYPE_TWO: sinon.stub().callsFake(() => null)
  }
  const callArg = {}

  const pool = {
    eventTypes: ['EVENT_TYPE_ONE', 'EVENT_TYPE_TWO'],
    deserializeState: sinon.stub().callsFake(() => 'DESERIALIZED_STATE'),
    snapshotAdapter,
    invariantHash: 'HASH',
    projection,
    eventStore,
    eventHandler
  }

  const viewModel = await init(pool, aggregateIds, 'KEY')

  const {
    aggregatesVersionsMap,
    handler: boundHandler,
    ...restViewModel
  } = viewModel

  expect(Array.from(aggregatesVersionsMap)).toEqual(savedAggregatesVersionsMap)
  expect(pool.deserializeState.callCount).toEqual(1)
  expect(pool.deserializeState.firstCall.args[0]).toEqual('SAVED_STATE')

  expect(eventHandler.callCount).toEqual(0)
  await boundHandler(callArg)
  expect(eventHandler.callCount).toEqual(1)
  expect(eventHandler.firstCall.args[0]).toEqual(pool)
  expect(eventHandler.firstCall.args[1]).toEqual(viewModel)
  expect(eventHandler.firstCall.args[2]).toEqual(callArg)

  expect(restViewModel).toEqual({
    lastTimestamp: savedLastTimestamp,
    state: 'DESERIALIZED_STATE',
    disposed: false,
    aggregateIds: null,
    snapshotKey: 'HASH;KEY',
    key: 'KEY'
  })

  expect(eventStore.loadEvents.callCount).toEqual(1)

  expect(eventStore.loadEvents.firstCall.args[0]).toEqual({
    eventTypes: pool.eventTypes,
    aggregateIds: null,
    startTime: viewModel.lastTimestamp,
    skipBus: true
  })

  expect(eventStore.loadEvents.firstCall.args[1]).toEqual(boundHandler)

  expect(viewModel.hasOwnProperty('initPromise')).toEqual(false)
})
