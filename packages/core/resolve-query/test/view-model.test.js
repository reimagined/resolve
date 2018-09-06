import sinon from 'sinon'

import createViewModel from '../src/view-model'

describe('resolve-query view-model', () => {
  let eventList, eventStore, projection, unsubscribe, snapshotAdapter

  const simulatedEventList = [
    { type: 'UserAdded', aggregateId: '1', payload: { UserName: 'User-1' } },
    { type: 'UserAdded', aggregateId: '2', payload: { UserName: 'User-2' } },
    { type: 'UserAdded', aggregateId: '3', payload: { UserName: 'User-3' } },
    { type: 'UserDeleted', aggregateId: '1' }
  ]

  const invariantHash = 'unique-view-model-hash'
  const snapshotBucketSize = 1

  beforeEach(() => {
    unsubscribe = sinon.stub()
    eventList = []

    const subscribeByAnyField = async (fieldName, matchList, handler) => {
      for (let event of eventList) {
        if (event[fieldName] && !matchList.includes(event[fieldName])) continue
        await Promise.resolve()
        handler(event)
      }
      return unsubscribe
    }

    eventStore = {
      getEventsByAggregateId(aggregateIds, callback) {
        for (const event of eventList) {
          if (aggregateIds === '*') {
            callback(event)
          } else if (aggregateIds.includes(event.aggregateId)) {
            callback(event)
          }
        }
        return Promise.resolve()
      },
      subscribeByEventType: sinon
        .stub()
        .callsFake(subscribeByAnyField.bind(null, 'type')),
      subscribeByAggregateId: sinon
        .stub()
        .callsFake(subscribeByAnyField.bind(null, 'aggregateId'))
    }

    projection = {
      Init: sinon.stub().callsFake(() => []),
      TestEvent: sinon
        .stub()
        .callsFake((state, event) => state.concat([event.payload]))
    }

    snapshotAdapter = {
      loadSnapshot: sinon.stub().callsFake(async () => {}),
      saveSnapshot: sinon.stub()
    }
  })

  afterEach(() => {
    snapshotAdapter = null
    eventStore = null
    eventList = null
  })

  it('should raise error on view-model with snapshot adapter without invariantHash', async () => {
    try {
      createViewModel({ eventStore, projection, snapshotAdapter })

      return Promise.reject('test failed')
    } catch (error) {
      expect(error).toBeInstanceOf(Error)
      expect(error.message).toEqual(
        `Field 'invariantHash' is mandatory when using view-model snapshots`
      )
    }
  })

  it('should support view-models with redux-like projection functions', async () => {
    const viewModel = createViewModel({ eventStore, projection })

    const testEvent = {
      type: 'TestEvent',
      aggregateId: 'test-id',
      payload: 'test-payload'
    }
    eventList = [testEvent]

    const result = await viewModel.read({ aggregateIds: ['test-id'] })

    expect(result).toEqual(['test-payload'])
  })

  it('should support view-models with many aggregate ids', async () => {
    const viewModel = createViewModel({ eventStore, projection })

    const testEvent1 = {
      type: 'TestEvent',
      aggregateId: 'test-id-1',
      payload: 'test-payload-1'
    }
    const testEvent2 = {
      type: 'TestEvent',
      aggregateId: 'test-id-2',
      payload: 'test-payload-2'
    }
    eventList = [testEvent1, testEvent2]

    const result1 = await viewModel.read({
      aggregateIds: ['test-id-1']
    })
    const result2 = await viewModel.read({
      aggregateIds: ['test-id-2']
    })

    expect(result1).toEqual(['test-payload-1'])
    expect(result2).toEqual(['test-payload-2'])
  })

  it('should support view-models with wildcard aggregate ids', async () => {
    const viewModel = createViewModel({ eventStore, projection })

    const testEvent1 = {
      type: 'TestEvent',
      aggregateId: 'test-id-1',
      payload: 'test-payload-1'
    }
    const testEvent2 = {
      type: 'TestEvent',
      aggregateId: 'test-id-2',
      payload: 'test-payload-2'
    }
    eventList = [testEvent1, testEvent2]

    const result = await viewModel.read({ aggregateIds: '*' })

    expect(result).toEqual(['test-payload-1', 'test-payload-2'])
  })

  // eslint-disable-next-line max-len
  it("should raise error in case of if view-model's aggregateIds argument absence", async () => {
    const viewModel = createViewModel({ eventStore, projection })

    const testEvent = {
      type: 'TestEvent',
      aggregateId: 'test-id',
      payload: 'test-payload'
    }
    eventList = [testEvent]

    try {
      await viewModel.read()
      return Promise.reject('Test failed')
    } catch (error) {
      expect(error.message).toMatch(
        /View models are build up only with aggregateIds array or wildcard argument/
      )
    }
  })

  it('should handle view-models error on Init function', async () => {
    const error = new Error('InitError')
    const wrongViewModel = createViewModel({
      eventStore,
      projection: {
        Init: () => {
          throw error
        }
      }
    })

    const args = { aggregateIds: '*' }
    await wrongViewModel.read(args)
    const lastError = await wrongViewModel.getLastError(args)

    expect(lastError).toEqual(error)
  })

  it('should handle view-models error on custom event handler function', async () => {
    const error = new Error('InitError')
    const wrongViewModel = createViewModel({
      eventStore,
      projection: {
        TestEvent: () => {
          throw error
        }
      }
    })
    eventList = [
      {
        type: 'TestEvent',
        aggregateId: 'test-id-1'
      },
      {
        type: 'TestEvent',
        aggregateId: 'test-id-2'
      }
    ]

    const args = { aggregateIds: '*' }
    await wrongViewModel.read(args)
    const lastError = await wrongViewModel.getLastError(args)

    expect(lastError).toEqual(error)
  })

  it('should support view-model with caching subscription and last state', async () => {
    const viewModel = createViewModel({ eventStore, projection })

    const testEvent = {
      type: 'TestEvent',
      aggregateId: 'test-id',
      payload: 'test-payload'
    }
    eventList = [testEvent]

    const result1 = await viewModel.read({
      aggregateIds: ['test-id']
    })
    const result2 = await viewModel.read({
      aggregateIds: ['test-id']
    })

    expect(result1).toEqual(['test-payload'])
    expect(result2).toEqual(['test-payload'])

    expect(projection.Init.callCount).toEqual(1)
    expect(projection.TestEvent.callCount).toEqual(1)

    expect(unsubscribe.callCount).toEqual(0)
  })

  it('should support snapshot adapter restoring with normal snapshot and saving', async () => {
    snapshotAdapter = {
      loadSnapshot: sinon.stub().callsFake(async () => ({
        aggregateIdsSet: [],
        timestamp: 1000,
        state: ['test-payload']
      })),
      saveSnapshot: sinon.stub()
    }

    const viewModel = createViewModel({
      eventStore,
      projection,
      snapshotAdapter,
      snapshotBucketSize,
      invariantHash
    })

    const testEvent = {
      type: 'TestEvent',
      aggregateId: 'test-id',
      payload: 'test-payload'
    }
    eventList = [testEvent, testEvent]

    const result = await viewModel.read({
      aggregateIds: ['test-id']
    })

    expect(result).toEqual(['test-payload', 'test-payload', 'test-payload'])

    expect(projection.Init.callCount).toEqual(0)
    expect(projection.TestEvent.callCount).toEqual(2)

    expect(snapshotAdapter.loadSnapshot.callCount).toEqual(1)
    expect(snapshotAdapter.saveSnapshot.callCount).toEqual(2)

    expect(unsubscribe.callCount).toEqual(0)
  })

  it('should support snapshot adapter restoring with bad snapshot and saving', async () => {
    snapshotAdapter = {
      loadSnapshot: sinon.stub().callsFake(async () => ({
        aggregateIdsSet: null,
        timestamp: null,
        state: null
      })),
      saveSnapshot: sinon.stub()
    }

    const viewModel = createViewModel({
      eventStore,
      projection,
      snapshotAdapter,
      snapshotBucketSize,
      invariantHash
    })

    const testEvent = {
      type: 'TestEvent',
      aggregateId: 'test-id',
      payload: 'test-payload'
    }
    eventList = [testEvent, testEvent]

    const result = await viewModel.read({
      aggregateIds: ['test-id']
    })

    expect(result).toEqual(['test-payload', 'test-payload'])

    expect(projection.Init.callCount).toEqual(1)
    expect(projection.TestEvent.callCount).toEqual(2)

    expect(snapshotAdapter.loadSnapshot.callCount).toEqual(1)
    expect(snapshotAdapter.saveSnapshot.callCount).toEqual(2)

    expect(unsubscribe.callCount).toEqual(0)
  })

  it('should support view-model disposing by aggregate-id', async () => {
    const viewModel = createViewModel({ eventStore, projection })

    eventList = simulatedEventList.slice(0)
    await viewModel.read({ aggregateIds: ['test-aggregate-id'] })
    viewModel.dispose('test-aggregate-id')
    viewModel.dispose('test-aggregate-wrong-id')
    await Promise.resolve()

    expect(unsubscribe.callCount).toEqual(1)
  })

  it('should support view-model wildcard disposing', async () => {
    const viewModel = createViewModel({ eventStore, projection })

    eventList = simulatedEventList.slice(0)
    await viewModel.read({ aggregateIds: ['test-aggregate-id'] })
    viewModel.dispose()
    await Promise.resolve()

    expect(unsubscribe.callCount).toEqual(1)
  })

  it('should not dispose view-model after it disposed', async () => {
    const viewModel = createViewModel({ eventStore, projection })

    eventList = simulatedEventList.slice(0)
    await viewModel.read({ aggregateIds: ['test-aggregate-id'] })
    viewModel.dispose()
    viewModel.dispose()
    await Promise.resolve()

    expect(unsubscribe.callCount).toEqual(1)
  })
})
