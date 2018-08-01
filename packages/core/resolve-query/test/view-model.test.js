import sinon from 'sinon'

import createViewModel from '../src/view-model'

describe('resolve-query view-model', () => {
  let eventList, eventStore, viewModelProjection, viewModel, unsubscribe

  const simulatedEventList = [
    { type: 'UserAdded', aggregateId: '1', payload: { UserName: 'User-1' } },
    { type: 'UserAdded', aggregateId: '2', payload: { UserName: 'User-2' } },
    { type: 'UserAdded', aggregateId: '3', payload: { UserName: 'User-3' } },
    { type: 'UserDeleted', aggregateId: '1' }
  ]

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

    viewModelProjection = {
      Init: sinon.stub().callsFake(() => []),
      TestEvent: sinon
        .stub()
        .callsFake((state, event) => state.concat([event.payload]))
    }

    viewModel = createViewModel({ eventStore, projection: viewModelProjection })
  })

  afterEach(() => {
    viewModel = null
    eventStore = null
    eventList = null
  })

  it('should support view-models with redux-like projection functions', async () => {
    const testEvent = {
      type: 'TestEvent',
      aggregateId: 'test-id',
      payload: 'test-payload'
    }
    eventList = [testEvent]

    const { state } = await viewModel.read({ aggregateIds: ['test-id'] })

    expect(state).toEqual(['test-payload'])
  })

  it('should support view-models with many aggregate ids', async () => {
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

    const { state: state1 } = await viewModel.read({
      aggregateIds: ['test-id-1']
    })
    const { state: state2 } = await viewModel.read({
      aggregateIds: ['test-id-2']
    })

    expect(state1).toEqual(['test-payload-1'])
    expect(state2).toEqual(['test-payload-2'])
  })

  it('should support view-models with wildcard aggregate ids', async () => {
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

    const { state } = await viewModel.read({ aggregateIds: '*' })

    expect(state).toEqual(['test-payload-1', 'test-payload-2'])
  })

  // eslint-disable-next-line max-len
  it("should raise error in case of if view-model's aggregateIds argument absence", async () => {
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

  it('should fail on view-models with non-redux/async projection functions', async () => {
    const wrongViewModel = createViewModel({
      eventStore,
      projection: {
        TestEvent: async () => null
      }
    })
    eventList = [
      {
        type: 'TestEvent',
        aggregateId: 'test-id'
      }
    ]

    try {
      await wrongViewModel.read({ aggregateIds: ['test-id'] })
      return Promise.reject('Test failed')
    } catch (error) {
      expect(error.message).toMatch(
        /A Projection function cannot be asynchronous or return a Promise object/
      )
    }
  })

  it('should fail on view-models with non-redux/generator projection functions', async () => {
    const wrongViewModel = createViewModel({
      eventStore,
      projection: {
        TestEvent: function*() {}
      }
    })
    eventList = [
      {
        type: 'TestEvent',
        aggregateId: 'test-id'
      }
    ]

    try {
      await wrongViewModel.read({ aggregateIds: ['test-id'] })
      return Promise.reject('Test failed')
    } catch (error) {
      expect(error.message).toMatch(
        /A Projection function cannot be a generator or return an iterable object/
      )
    }
  })

  it('should handle view-models error on Init function', async () => {
    const wrongViewModel = createViewModel({
      eventStore,
      projection: {
        Init: () => {
          throw new Error('InitError')
        }
      }
    })

    try {
      await wrongViewModel.read({ aggregateIds: '*' })
      return Promise.reject('Test failed')
    } catch (error) {
      expect(error.message).toMatch(/InitError/)
    }
  })

  it('should handle view-models error on custom event handler function', async () => {
    const wrongViewModel = createViewModel({
      eventStore,
      projection: {
        TestEvent: () => {
          throw new Error('TestEventError')
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

    try {
      await wrongViewModel.read({ aggregateIds: '*' })
      return Promise.reject('Test failed')
    } catch (error) {
      expect(error.message).toMatch(/TestEventError/)
    }
  })

  it('should support view-model with caching subscription and last state', async () => {
    const testEvent = {
      type: 'TestEvent',
      aggregateId: 'test-id',
      payload: 'test-payload'
    }
    eventList = [testEvent]

    const { state: stateOne } = await viewModel.read({
      aggregateIds: ['test-id']
    })
    const { state: stateTwo } = await viewModel.read({
      aggregateIds: ['test-id']
    })

    expect(stateOne).toEqual(['test-payload'])
    expect(stateTwo).toEqual(['test-payload'])

    expect(viewModelProjection.Init.callCount).toEqual(1)
    expect(viewModelProjection.TestEvent.callCount).toEqual(1)

    expect(unsubscribe.callCount).toEqual(0)
  })

  it('should support view-model disposing by aggregate-id', async () => {
    eventList = simulatedEventList.slice(0)
    await viewModel.read({ aggregateIds: ['test-aggregate-id'] })
    viewModel.dispose('test-aggregate-id')
    viewModel.dispose('test-aggregate-wrong-id')
    await Promise.resolve()

    expect(unsubscribe.callCount).toEqual(1)
  })

  it('should support view-model wildcard disposing', async () => {
    eventList = simulatedEventList.slice(0)
    await viewModel.read({ aggregateIds: ['test-aggregate-id'] })
    viewModel.dispose()
    await Promise.resolve()

    expect(unsubscribe.callCount).toEqual(1)
  })

  it('should not dispose view-model after it disposed', async () => {
    eventList = simulatedEventList.slice(0)
    await viewModel.read({ aggregateIds: ['test-aggregate-id'] })
    viewModel.dispose()
    viewModel.dispose()
    await Promise.resolve()

    expect(unsubscribe.callCount).toEqual(1)
  })
})
