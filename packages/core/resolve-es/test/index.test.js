/* eslint no-unused-expressions: 0 */

import createEventStore from '../src/index'
import { Readable } from 'stream'

describe('resolve-es', () => {
  it('loadEvents should perform events loading and transmitting from storage', async () => {
    const handler = jest.fn().mockImplementation(async () => {})
    const event = { type: 'EVENT_TYPE' }
    const storage = {
      loadEvents: jest.fn().mockImplementation(async (_, callback) => {
        await callback(event)
      }),
      saveEvents: jest.fn(),
      import: jest.fn(),
      export: jest.fn(),
      getLatestEvent: jest.fn()
    }

    const eventStore = createEventStore({ storage })
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

    expect(storage.loadEvents.mock.calls.length).toEqual(1)
    expect(storage.loadEvents.mock.calls[0][0]).toEqual({
      startTime,
      finishTime,
      eventTypes,
      aggregateIds
    })
    expect(storage.loadEvents.mock.calls[0][1]).toEqual(handler)

    expect(handler.mock.calls.length).toEqual(1)
    expect(handler.mock.calls[0][0]).toEqual(event)
  })

  it('should return export stream', async () => {
    const stream = new Readable()
    const storage = {
      export: jest.fn().mockReturnValue(stream),
      saveEvents: jest.fn(),
      import: jest.fn(),
      loadEvents: jest.fn(),
      getLatestEvent: jest.fn()
    }

    const eventStore = createEventStore({ storage })

    const result = eventStore.export()

    expect(storage.export).toHaveBeenCalled()
    expect(result).toEqual(stream)
  })

  it('should return import stream', async () => {
    const stream = new Readable()
    const storage = {
      import: jest.fn().mockReturnValue(stream),
      saveEvents: jest.fn(),
      loadEvents: jest.fn(),
      export: jest.fn(),
      getLatestEvent: jest.fn()
    }

    const eventStore = createEventStore({ storage })

    const result = eventStore.import()

    expect(storage.import).toHaveBeenCalled()
    expect(result).toEqual(stream)
  })

  it('saveEvent should save and propagate event', async () => {
    const storage = {
      saveEvent: jest.fn().mockReturnValue(Promise.resolve()),
      loadEvents: jest.fn(),
      import: jest.fn(),
      export: jest.fn(),
      getLatestEvent: jest.fn()
    }

    const eventStore = createEventStore({ storage })
    const event = {
      type: 'EVENT',
      aggregateId: 'ID',
      aggregateVersion: 1,
      timestamp: 1
    }
    await eventStore.saveEvent(event)

    expect(storage.saveEvent).toHaveBeenCalledWith(event)
  })
})
