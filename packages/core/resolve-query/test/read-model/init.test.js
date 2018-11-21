import sinon from 'sinon'

import init from '../../src/read-model/init'

// eslint-disable-next-line max-len
test('Read-model init should init adapter and bind projection and perform event reading', async () => {
  const projectionInvoker = sinon.stub().callsFake(async () => null)
  const prepareProjectionResult = {
    aggregatesVersionsMap: new Map([['root-id1', 1], ['root-id2', 2]]),
    lastTimestamp: 100500
  }
  const adapterImpl = {
    prepareProjection: sinon
      .stub()
      .callsFake(async () => prepareProjectionResult),
    getReadInterface: sinon.stub().callsFake(async () => null)
  }
  const adapter = {
    init: sinon.stub().callsFake(() => adapterImpl)
  }
  const eventStore = {
    loadEvents: sinon.stub().callsFake(() => null)
  }
  const projection = {
    EVENT_TYPE_ONE: sinon.stub().callsFake(async () => null),
    EVENT_TYPE_TWO: sinon.stub().callsFake(async () => null)
  }
  const callArg = {}

  const repository = {
    loadDonePromise: Promise.resolve(),
    adapter,
    eventStore,
    projection,
    projectionInvoker
  }

  await init(repository)

  expect(repository.prepareProjection).toEqual(adapterImpl.prepareProjection)
  expect(repository.getReadInterface).toEqual(adapterImpl.getReadInterface)

  expect(repository.eventTypes).toEqual(['EVENT_TYPE_ONE', 'EVENT_TYPE_TWO'])

  const boundProjectionInvoker = repository.boundProjectionInvoker

  expect(projectionInvoker.callCount).toEqual(0)
  await boundProjectionInvoker(callArg)
  expect(projectionInvoker.callCount).toEqual(1)
  expect(projectionInvoker.firstCall.args[0]).toEqual(repository)
  expect(projectionInvoker.firstCall.args[1]).toEqual(callArg)

  expect(repository.prepareProjection.callCount).toEqual(1)

  expect(eventStore.loadEvents.callCount).toEqual(1)

  expect(eventStore.loadEvents.firstCall.args[0]).toEqual({
    eventTypes: repository.eventTypes,
    startTime: prepareProjectionResult.lastTimestamp,
    skipBus: true
  })

  expect(eventStore.loadEvents.firstCall.args[1]).toEqual(
    boundProjectionInvoker
  )

  expect(repository.hasOwnProperty('loadDonePromise')).toEqual(false)
})

test('Read-model init should init adapter and bypass empty projection', async () => {
  const projectionInvoker = sinon.stub().callsFake(async () => null)
  const prepareProjectionResult = {
    aggregatesVersionsMap: new Map([['root-id1', 1], ['root-id2', 2]]),
    lastTimestamp: 100500
  }
  const adapterImpl = {
    prepareProjection: sinon
      .stub()
      .callsFake(async () => prepareProjectionResult),
    getReadInterface: sinon.stub().callsFake(async () => null)
  }
  const adapter = {
    init: sinon.stub().callsFake(() => adapterImpl)
  }
  const eventStore = {
    loadEvents: sinon.stub().callsFake(() => null)
  }
  const projection = null

  const loadDonePromise = Promise.resolve()
  const repository = {
    loadDonePromise,
    adapter,
    eventStore,
    projection,
    projectionInvoker
  }

  await init(repository)

  expect(repository.prepareProjection).toEqual(adapterImpl.prepareProjection)
  expect(repository.getReadInterface).toEqual(adapterImpl.getReadInterface)

  expect(repository.hasOwnProperty('eventTypes')).toEqual(false)
  expect(repository.hasOwnProperty('boundProjectionInvoker')).toEqual(false)

  expect(repository.prepareProjection.callCount).toEqual(0)

  expect(eventStore.loadEvents.callCount).toEqual(0)

  expect(repository.loadDonePromise).toEqual(loadDonePromise)
})

// eslint-disable-next-line max-len
test('Read-model init should init adapter and bind projection and skip event reading', async () => {
  const projectionInvoker = sinon.stub().callsFake(async () => null)
  const prepareProjectionResult = {
    aggregatesVersionsMap: new Map([['root-id1', 1], ['root-id2', 2]]),
    lastTimestamp: 100500
  }
  const adapterImpl = {
    prepareProjection: sinon
      .stub()
      .callsFake(async () => prepareProjectionResult),
    getReadInterface: sinon.stub().callsFake(async () => null)
  }
  const adapter = {
    init: sinon.stub().callsFake(() => adapterImpl)
  }
  const eventStore = {
    loadEvents: sinon.stub().callsFake(() => null)
  }
  const projection = {
    EVENT_TYPE_ONE: sinon.stub().callsFake(async () => null),
    EVENT_TYPE_TWO: sinon.stub().callsFake(async () => null)
  }
  const callArg = {}

  const loadDonePromise = Promise.resolve()
  const repository = {
    loadDonePromise,
    adapter,
    eventStore,
    projection,
    projectionInvoker
  }

  await init(repository, true)

  expect(repository.prepareProjection).toEqual(adapterImpl.prepareProjection)
  expect(repository.getReadInterface).toEqual(adapterImpl.getReadInterface)

  expect(repository.eventTypes).toEqual(['EVENT_TYPE_ONE', 'EVENT_TYPE_TWO'])

  const boundProjectionInvoker = repository.boundProjectionInvoker

  expect(projectionInvoker.callCount).toEqual(0)
  await boundProjectionInvoker(callArg)
  expect(projectionInvoker.callCount).toEqual(1)
  expect(projectionInvoker.firstCall.args[0]).toEqual(repository)
  expect(projectionInvoker.firstCall.args[1]).toEqual(callArg)

  expect(repository.prepareProjection.callCount).toEqual(1)

  expect(eventStore.loadEvents.callCount).toEqual(1)

  expect(repository.loadDonePromise).toEqual(undefined)
})

// eslint-disable-next-line max-len
test('Read-model init should work with already initialized adapter', async () => {
  const prepareProjectionResult = {
    aggregatesVersionsMap: new Map([['root-id1', 1], ['root-id2', 2]]),
    lastTimestamp: 100500
  }
  const eventStore = {
    loadEvents: sinon.stub().callsFake(() => null)
  }

  const loadDonePromise = Promise.resolve()
  const repository = {
    prepareProjection: sinon
      .stub()
      .callsFake(async () => prepareProjectionResult),
    getReadInterface: sinon.stub().callsFake(async () => null),
    boundProjectionInvoker: sinon.stub().callsFake(async () => null),
    loadDonePromise,

    eventStore
  }

  await init(repository, true)

  expect(repository.prepareProjection.callCount).toEqual(1)

  expect(eventStore.loadEvents.callCount).toEqual(0)

  expect(repository.loadDonePromise).toEqual(undefined)
})
