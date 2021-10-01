import { jestTimeout, adapterFactory, adapters } from '../eventstore-test-utils'

import {
  initThreadArray,
  threadArrayToCursor,
  SavedEvent,
} from '@resolve-js/eventstore-base'

jest.setTimeout(jestTimeout())

describe(`${adapterFactory.name}. Eventstore adapter events filtering`, () => {
  beforeAll(adapterFactory.create('events_filter_testing'))
  afterAll(adapterFactory.destroy('events_filter_testing'))

  const adapter = adapters['events_filter_testing']

  const eventTypesCount = 4
  const aggregateIdCount = 5
  const eventMultiplier = 6

  const countEvents = eventTypesCount * aggregateIdCount * eventMultiplier

  const savedEvents: Array<SavedEvent> = []

  test('should save events with different aggregate ids and types', async () => {
    for (let eventIndex = 0; eventIndex < countEvents; eventIndex++) {
      const event = {
        aggregateId: `aggregateId_${1 + (eventIndex % aggregateIdCount)}`,
        aggregateVersion: eventIndex + 1,
        type: `EVENT_${1 + (eventIndex % eventTypesCount)}`,
        payload: { eventIndex },
        timestamp: eventIndex + 1,
      }
      const { event: savedEvent } = await adapter.saveEvent(event)
      savedEvents.push(savedEvent)

      if (Date.now() === savedEvent.timestamp) {
        await new Promise((resolve) => {
          setTimeout(resolve, 1)
        })
      }
    }
    savedEvents.sort((a, b) => {
      return (
        Math.sign(a.timestamp - b.timestamp) * 100 +
        Math.sign(a.threadCounter - b.threadCounter) * 10 +
        Math.sign(a.threadId - b.threadId)
      )
    })
  })

  test('should load 0 events by unknown type', async () => {
    const { events } = await adapter.loadEvents({
      limit: countEvents,
      eventTypes: ['UNKNOWN'],
      cursor: null,
    })
    expect(events).toHaveLength(0)

    const lastEvent = await adapter.getLatestEvent({ eventTypes: ['UNKNOWN'] })
    expect(lastEvent).toBeNull()
  })

  test('should load 0 events by empty type list and return the initial cursor', async () => {
    const { events, cursor } = await adapter.loadEvents({
      limit: countEvents,
      eventTypes: [],
      cursor: null,
    })
    expect(events).toHaveLength(0)
    expect(cursor).toEqual(threadArrayToCursor(initThreadArray()))

    const { cursor: shiftedCursor } = await adapter.loadEvents({
      cursor: null,
      limit: 1,
    })
    const {
      events: shiftedEvents,
      cursor: newCursor,
    } = await adapter.loadEvents({
      limit: countEvents,
      eventTypes: [],
      cursor: shiftedCursor,
    })
    expect(shiftedEvents).toHaveLength(0)
    expect(newCursor).toEqual(shiftedCursor)

    const lastEvent = await adapter.getLatestEvent({ eventTypes: [] })
    expect(lastEvent).toBeNull()
  })

  test('should load 0 events by unknown aggregateId', async () => {
    const { events } = await adapter.loadEvents({
      limit: countEvents,
      aggregateIds: ['unknownId'],
      cursor: null,
    })
    expect(events).toHaveLength(0)

    const lastEvent = await adapter.getLatestEvent({
      aggregateIds: ['unknownId'],
    })
    expect(lastEvent).toBeNull()
  })

  test('should load 0 events by empty aggregateId list and return the initial cursor', async () => {
    const { events, cursor } = await adapter.loadEvents({
      limit: countEvents,
      aggregateIds: [],
      cursor: null,
    })
    expect(events).toHaveLength(0)
    expect(cursor).toEqual(threadArrayToCursor(initThreadArray()))

    const { cursor: shiftedCursor } = await adapter.loadEvents({
      cursor: null,
      limit: 1,
    })
    const {
      events: shiftedEvents,
      cursor: newCursor,
    } = await adapter.loadEvents({
      limit: countEvents,
      aggregateIds: [],
      cursor: shiftedCursor,
    })
    expect(shiftedEvents).toHaveLength(0)
    expect(newCursor).toEqual(shiftedCursor)

    const lastEvent = await adapter.getLatestEvent({ aggregateIds: [] })
    expect(lastEvent).toBeNull()
  })

  test('should load events by type', async () => {
    const { events } = await adapter.loadEvents({
      limit: countEvents,
      eventTypes: ['EVENT_2'],
      cursor: null,
    })
    expect(events).toHaveLength(countEvents / eventTypesCount)
  })

  test('should load events by aggregateId', async () => {
    const { events } = await adapter.loadEvents({
      limit: countEvents,
      aggregateIds: ['aggregateId_2'],
      cursor: null,
    })
    expect(events).toHaveLength(countEvents / aggregateIdCount)
  })

  test('should load events by distinct event types', async () => {
    const eventTypes = ['EVENT_1', 'EVENT_3']

    const { events, cursor } = await adapter.loadEvents({
      limit: countEvents,
      eventTypes,
      cursor: null,
    })
    expect(events).toHaveLength(
      (countEvents / eventTypesCount) * eventTypes.length
    )
    for (let eventIndex = 0; eventIndex < events.length; ++eventIndex) {
      const event = events[eventIndex]
      expect(event.type === 'EVENT_1' || event.type === 'EVENT_3').toBeTruthy()
      if (event.type === 'EVENT_1') {
        expect(event.payload.eventIndex % eventTypesCount).toEqual(0)
      } else if (event.type === 'EVENT_3') {
        expect(event.payload.eventIndex % eventTypesCount).toEqual(2)
      }
    }

    const lastEvent = await adapter.getLatestEvent({
      eventTypes,
    })
    expect(lastEvent.timestamp).toEqual(events[events.length - 1].timestamp)

    const { cursor: endCursor } = await adapter.loadEvents({
      limit: 1,
      cursor,
      eventTypes,
    })
    expect(cursor).toEqual(endCursor)
  })

  test('should load events by distinct aggregate ids', async () => {
    const aggregateIds = ['aggregateId_2', 'aggregateId_4']

    const { events, cursor } = await adapter.loadEvents({
      limit: countEvents,
      aggregateIds,
      cursor: null,
    })
    expect(events).toHaveLength(
      (countEvents / aggregateIdCount) * aggregateIds.length
    )
    for (let eventIndex = 0; eventIndex < events.length; ++eventIndex) {
      const event = events[eventIndex]
      expect(
        event.aggregateId === 'aggregateId_2' ||
          event.aggregateId === 'aggregateId_4'
      ).toBeTruthy()
      if (event.type === 'aggregateId_2') {
        expect(event.payload.eventIndex % eventTypesCount).toEqual(1)
      } else if (event.type === 'aggregateId_4') {
        expect(event.payload.eventIndex % eventTypesCount).toEqual(3)
      }
    }

    const lastEvent = await adapter.getLatestEvent({
      aggregateIds,
    })
    expect(lastEvent.timestamp).toEqual(events[events.length - 1].timestamp)

    const { cursor: endCursor } = await adapter.loadEvents({
      limit: 1,
      cursor,
      aggregateIds,
    })
    expect(cursor).toEqual(endCursor)
  })

  test('should load events by combination of event type and aggregate id', async () => {
    const { events } = await adapter.loadEvents({
      limit: countEvents,
      aggregateIds: ['aggregateId_3'],
      eventTypes: ['EVENT_2'],
      cursor: null,
    })
    expect(events).toHaveLength(
      countEvents / (aggregateIdCount * eventTypesCount)
    )
    for (let eventIndex = 0; eventIndex < events.length; ++eventIndex) {
      const event = events[eventIndex]
      expect(event.type).toEqual('EVENT_2')
      expect(event.aggregateId).toEqual('aggregateId_3')
    }

    const lastEvent = await adapter.getLatestEvent({
      aggregateIds: ['aggregateId_3'],
      eventTypes: ['EVENT_2'],
    })
    expect(lastEvent.timestamp).toEqual(events[events.length - 1].timestamp)
  })

  test('should load events by combination of distinct event types and aggregate ids', async () => {
    const aggregateIds = ['aggregateId_1', 'aggregateId_5']
    const eventTypes = ['EVENT_1', 'EVENT_4']

    const { events } = await adapter.loadEvents({
      limit: countEvents,
      aggregateIds,
      eventTypes,
      cursor: null,
    })
    expect(events).toHaveLength(
      (countEvents / (aggregateIdCount * eventTypesCount)) *
        (aggregateIds.length + eventTypes.length)
    )
    for (let eventIndex = 0; eventIndex < events.length; ++eventIndex) {
      const event = events[eventIndex]
      expect(event.type === 'EVENT_1' || event.type === 'EVENT_4').toBeTruthy()
      expect(
        event.aggregateId === 'aggregateId_1' ||
          event.aggregateId === 'aggregateId_5'
      ).toBeTruthy()
    }

    const lastEvent = await adapter.getLatestEvent({
      aggregateIds: ['aggregateId_1', 'aggregateId_5'],
      eventTypes: ['EVENT_1', 'EVENT_4'],
    })
    expect(lastEvent.timestamp).toEqual(events[events.length - 1].timestamp)
  })

  test('should load events by timestamp', async () => {
    const { events } = await adapter.loadEvents({
      limit: countEvents,
      startTime: savedEvents[0].timestamp,
      finishTime: savedEvents[countEvents / 3 - 1].timestamp,
    })
    expect(events.length).toBeGreaterThanOrEqual(countEvents / 3)

    for (let i = 0; i < events.length; ++i) {
      expect(events[i].type).toEqual(savedEvents[i].type)
      expect(events[i].aggregateId).toEqual(savedEvents[i].aggregateId)
      expect(events[i].threadId).toEqual(savedEvents[i].threadId)
      expect(events[i].threadCounter).toEqual(savedEvents[i].threadCounter)
    }

    const middleEventsIndex = savedEvents.findIndex((event) => {
      return event.timestamp === savedEvents[countEvents / 3].timestamp
    })
    expect(middleEventsIndex).toBeGreaterThan(0)

    const { events: otherEvents } = await adapter.loadEvents({
      limit: countEvents,
      startTime: savedEvents[middleEventsIndex].timestamp,
      finishTime: savedEvents[(countEvents / 3) * 2 - 1].timestamp,
    })
    expect(otherEvents.length).toBeGreaterThanOrEqual(countEvents / 3)

    for (let i = 0; i < otherEvents.length; ++i) {
      expect(otherEvents[i].type).toEqual(
        savedEvents[i + middleEventsIndex].type
      )
      expect(otherEvents[i].aggregateId).toEqual(
        savedEvents[i + middleEventsIndex].aggregateId
      )
      expect(otherEvents[i].threadId).toEqual(
        savedEvents[i + middleEventsIndex].threadId
      )
      expect(otherEvents[i].threadCounter).toEqual(
        savedEvents[i + middleEventsIndex].threadCounter
      )
    }

    const lastEventsIndex = savedEvents.findIndex((event) => {
      return event.timestamp === savedEvents[(countEvents / 3) * 2].timestamp
    })
    expect(lastEventsIndex).toBeGreaterThan(0)

    const { events: lastEvents } = await adapter.loadEvents({
      limit: countEvents,
      startTime: savedEvents[lastEventsIndex].timestamp,
      finishTime: savedEvents[countEvents - 1].timestamp,
    })
    expect(lastEvents.length).toBeGreaterThanOrEqual(countEvents / 3)

    for (let i = 0; i < lastEvents.length; ++i) {
      expect(lastEvents[i].type).toEqual(savedEvents[i + lastEventsIndex].type)
      expect(lastEvents[i].aggregateId).toEqual(
        savedEvents[i + lastEventsIndex].aggregateId
      )
      expect(lastEvents[i].threadId).toEqual(
        savedEvents[i + lastEventsIndex].threadId
      )
      expect(lastEvents[i].threadCounter).toEqual(
        savedEvents[i + lastEventsIndex].threadCounter
      )
    }
  })
})
