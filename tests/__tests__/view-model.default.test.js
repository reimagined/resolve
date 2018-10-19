import { createViewModel } from 'resolve-query'

import projection from '../view-models/default.projection'
import serializeState from '../view-models/default.serialize_state'
import deserializeState from '../view-models/default.deserialize_state'

describe('View-model generic adapter API', () => {
  let buildTestViewModelReader, events

  it('View model with one aggregate id', async () => {
    events.push({
      type: 'EVENT_APPEARED',
      aggregateId: 'aggregate-id',
      timestamp: 100,
      payload: 'test'
    })
    const reader = buildTestViewModelReader()

    const result = await reader(['aggregate-id'])
    expect(result).toMatchSnapshot()
  })

  it('View model with several aggregate ids', async () => {
    events.push({
      type: 'EVENT_APPEARED',
      aggregateId: 'aggregate-id1',
      timestamp: 100,
      payload: 'test'
    })
    events.push({
      type: 'EVENT_APPEARED',
      aggregateId: 'aggregate-id2',
      timestamp: 101,
      payload: 'test'
    })
    const reader = buildTestViewModelReader()

    const result = await reader(['aggregate-id1', 'aggregate-id2'])
    expect(result).toMatchSnapshot()
  })

  it('View model with wildcard aggregate ids', async () => {
    events.push({
      type: 'EVENT_APPEARED',
      aggregateId: 'aggregate-id1',
      timestamp: 100,
      payload: 'test'
    })
    events.push({
      type: 'EVENT_APPEARED',
      aggregateId: 'aggregate-id2',
      timestamp: 101,
      payload: 'test'
    })
    events.push({
      type: 'EVENT_APPEARED',
      aggregateId: 'aggregate-id3',
      timestamp: 102,
      payload: 'test'
    })
    const reader = buildTestViewModelReader()

    const result = await reader('*')
    expect(result).toMatchSnapshot()
  })

  beforeEach(async () => {
    events = []
    const eventStore = {
      async loadEvents({ eventTypes, startTime, aggregateIds }, handler) {
        for (let event of events) {
          if (
            event &&
            eventTypes.indexOf(event.type) > -1 &&
            (aggregateIds == null ||
              aggregateIds.indexOf(event.aggregateId) > -1) &&
            event.timestamp >= startTime
          ) {
            await handler(event)
            await Promise.resolve()
          }
        }

        return () => null
      }
    }

    buildTestViewModelReader = () => {
      const viewModel = createViewModel({
        projection,
        eventStore
      })

      return async aggregateIds => {
        const originResult = await viewModel.read({ aggregateIds })
        const serializedResult = serializeState(originResult.state)
        const deserializedResult = deserializeState(serializedResult)

        const lastError = await viewModel.getLastError({ aggregateIds })
        if (lastError != null) {
          throw lastError
        }

        return deserializedResult
      }
    }
  })

  afterEach(async () => {
    buildTestViewModelReader = null
    events = null
  })
})
