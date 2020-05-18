/* eslint no-unused-expressions: 0 */

import createEventStore from '../src/index'
import { Readable } from 'stream'

describe('resolve-es', () => {
  it('loadEvents should perform events loading and transmitting from eventstore', async () => {
    const handler = jest.fn().mockImplementation(async () => {})
    const event = { type: 'EVENT_TYPE' }
    const eventstore = {
      loadEvents: jest.fn().mockImplementation(async (_, callback) => {
        await callback(event)
      }),
      saveEvents: jest.fn(),
      import: jest.fn(),
      export: jest.fn(),
      getLatestEvent: jest.fn(),
      getNextCursor: jest.fn()
    }

    const eventStore = createEventStore({ eventstore })
    const eventTypes = ['EVENT_TYPE']
    const aggregateIds = ['AGGREGATE_ID']
    const startTime = 100
    const finishTime = 200
    const filter = {
      startTime,
      finishTime,
      eventTypes,
      aggregateIds
    }

    await eventStore.loadEvents(filter, handler)

    expect(eventstore.loadEvents.mock.calls.length).toEqual(1)
    expect(eventstore.loadEvents.mock.calls[0][0]).toEqual({
      startTime,
      finishTime,
      eventTypes,
      aggregateIds
    })
    expect(eventstore.loadEvents.mock.calls[0][1]).toEqual(handler)

    expect(handler.mock.calls.length).toEqual(1)
    expect(handler.mock.calls[0][0]).toEqual(event)
  })

  it('should return export stream', async () => {
    const stream = new Readable()
    const eventstore = {
      export: jest.fn().mockReturnValue(stream),
      saveEvents: jest.fn(),
      import: jest.fn(),
      loadEvents: jest.fn(),
      getLatestEvent: jest.fn(),
      getNextCursor: jest.fn()
    }

    const eventStore = createEventStore({ eventstore })

    const result = eventStore.export()

    expect(eventstore.export).toHaveBeenCalled()
    expect(result).toEqual(stream)
  })

  it('should return import stream', async () => {
    const stream = new Readable()
    const eventstore = {
      import: jest.fn().mockReturnValue(stream),
      saveEvents: jest.fn(),
      loadEvents: jest.fn(),
      export: jest.fn(),
      getLatestEvent: jest.fn(),
      getNextCursor: jest.fn()
    }

    const eventStore = createEventStore({ eventstore })

    const result = eventStore.import()

    expect(eventstore.import).toHaveBeenCalled()
    expect(result).toEqual(stream)
  })

  it('saveEvent should save and propagate event', async () => {
    const eventstore = {
      saveEvent: jest.fn().mockReturnValue(Promise.resolve()),
      loadEvents: jest.fn(),
      import: jest.fn(),
      export: jest.fn(),
      getLatestEvent: jest.fn(),
      getNextCursor: jest.fn()
    }

    const eventStore = createEventStore({ eventstore })
    const event = {
      type: 'EVENT',
      aggregateId: 'ID',
      aggregateVersion: 1,
      timestamp: 1
    }
    await eventStore.saveEvent(event)

    expect(eventstore.saveEvent).toHaveBeenCalledWith(event)
  })
})
