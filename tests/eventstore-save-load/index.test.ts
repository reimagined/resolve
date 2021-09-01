import {
  adapterFactory,
  adapters,
  jestTimeout,
  makeTestEvent,
} from '../eventstore-test-utils'

import {
  threadArrayToCursor,
  checkEventsContinuity,
  THREAD_COUNT,
  EventWithCursor,
  ConcurrentError,
} from '@resolve-js/eventstore-base'

import type { SavedEvent } from '@resolve-js/eventstore-base'

jest.setTimeout(jestTimeout())

describe(`${adapterFactory.name}. Eventstore adapter events saving and loading`, () => {
  beforeAll(adapterFactory.create('save_and_load_testing'))
  afterAll(adapterFactory.destroy('save_and_load_testing'))

  const adapter = adapters['save_and_load_testing']

  let eventCursorPairs: EventWithCursor[] = []

  const firstEvent = {
    aggregateVersion: 1,
    aggregateId: 'ID_1',
    type: 'TYPE_1',
    payload: { message: 'hello' },
    timestamp: 1,
  }

  test('should be able to save and load an event', async () => {
    const saveResult = await adapter.saveEvent(firstEvent)

    const { cursor: returnedCursor, event: savedEvent } = saveResult
    eventCursorPairs.push(saveResult)

    expect(checkEventsContinuity(null, [saveResult])).toBe(true)

    const { events, cursor } = await adapter.loadEvents({
      eventTypes: null,
      aggregateIds: null,
      limit: 1,
      cursor: null,
    })
    expect(events).toHaveLength(1)

    const loadedEvent = events[0]
    expect(loadedEvent.type).toEqual('TYPE_1')
    expect(loadedEvent.payload).toEqual({ message: 'hello' })
    expect(loadedEvent.timestamp).toBeGreaterThan(0)
    expect(loadedEvent).toEqual(savedEvent)
    expect(typeof cursor).toBe('string')
    expect(returnedCursor).toEqual(cursor)
  })

  test('should throw ConcurrentError when saving event with the same aggregateVersion', async () => {
    await expect(adapter.saveEvent(firstEvent)).rejects.toThrow(ConcurrentError)
  })

  const checkCount = 256
  test('saved events and corresponding cursors must match the subsequent loadEvents result', async () => {
    for (let i = 1; i < checkCount; ++i) {
      const event = makeTestEvent(i)
      const saveResult = await adapter.saveEvent(event)
      eventCursorPairs.push(saveResult)
    }
    expect(eventCursorPairs).toHaveLength(checkCount)
    eventCursorPairs.sort((a, b) => {
      return Math.sign(
        Math.sign(a.event.timestamp - b.event.timestamp) * 100 +
          Math.sign(a.event.threadCounter - b.event.threadCounter) * 10 +
          Math.sign(a.event.threadId - b.event.threadId)
      )
    })

    let currentCursor = null
    let loadedEvents: SavedEvent[] = []
    const step = 100
    for (let i = 0; i < checkCount; i += step) {
      const { events, cursor: nextCursor } = await adapter.loadEvents({
        limit: 100,
        cursor: currentCursor,
      })
      expect(nextCursor).toEqual(
        eventCursorPairs[Math.min(i + step, checkCount) - 1].cursor
      )
      loadedEvents = loadedEvents.concat(events)
      currentCursor = nextCursor
    }
    expect(loadedEvents).toHaveLength(checkCount)
    for (let i = 0; i < checkCount; ++i) {
      expect(eventCursorPairs[i].event).toEqual(loadedEvents[i])
    }
  })

  test('same cursors are not continuous', async () => {
    expect(
      checkEventsContinuity(
        eventCursorPairs[0].cursor,
        eventCursorPairs.slice(0, 1)
      )
    ).toBe(false)

    expect(
      checkEventsContinuity(
        eventCursorPairs[1].cursor,
        eventCursorPairs.slice(1, 3)
      )
    ).toBe(false)
  })

  test('scattered events are not continuous', async () => {
    expect(checkEventsContinuity(null, eventCursorPairs.slice(1, 3))).toBe(
      false
    )
    expect(
      checkEventsContinuity(
        eventCursorPairs[1].cursor,
        eventCursorPairs.slice(3, 6)
      )
    ).toBe(false)
    expect(
      checkEventsContinuity(null, [
        eventCursorPairs[0],
        eventCursorPairs[1],
        eventCursorPairs[10],
      ])
    ).toBe(false)
    expect(
      checkEventsContinuity(eventCursorPairs[2].cursor, [
        eventCursorPairs[3],
        eventCursorPairs[4],
        eventCursorPairs[12],
      ])
    ).toBe(false)
  })

  test('consequentially saved events are continuous', async () => {
    const middleIndex = Math.floor(eventCursorPairs.length / 2)

    expect(checkEventsContinuity(null, eventCursorPairs)).toBe(true)

    expect(
      checkEventsContinuity(null, eventCursorPairs.slice(0, middleIndex + 1))
    ).toBe(true)
    /*expect(
      checkEventsContinuity(
        eventCursorPairs[middleIndex].cursor,
        eventCursorPairs.slice(middleIndex + 1)
      )
    ).toBe(true)*/
  })

  test('consequentially saved events are continuous regardless the order in array', async () => {
    expect(
      checkEventsContinuity(null, [eventCursorPairs[1], eventCursorPairs[0]])
    ).toBe(true)

    /*expect(
      checkEventsContinuity(eventCursorPairs[0].cursor, [
        eventCursorPairs[2],
        eventCursorPairs[1],
      ])
    ).toBe(true)*/
  })

  test('many events saved in parallel should be continuous', async () => {
    const parallelWrites = 100
    const promises: Promise<EventWithCursor>[] = []
    for (let i = 0; i < parallelWrites; ++i) {
      promises.push(
        adapter.saveEvent({
          aggregateVersion: 1,
          aggregateId: `PARALLEL_ID_${i}`,
          type: 'PARALLEL_TYPE',
          payload: { message: 'hello' },
          timestamp: 1,
        })
      )
    }
    const parallelEventCursorPairs: EventWithCursor[] = await Promise.all(
      promises
    )

    expect(
      checkEventsContinuity(
        eventCursorPairs[eventCursorPairs.length - 1].cursor,
        parallelEventCursorPairs
      )
    ).toBe(true)
  })
})

describe(`${adapterFactory.name}. Eventstore adapter getCursorUntilEventTypes`, () => {
  beforeAll(adapterFactory.create('until_event_type_testing'))
  afterAll(adapterFactory.destroy('until_event_type_testing'))

  const adapter = adapters['until_event_type_testing']

  test('should return initial cursor if event-store is empty', async () => {
    const cursor = await adapter.getCursorUntilEventTypes(null, ['TYPE_1'])
    const arr = new Array<number>(THREAD_COUNT)
    arr.fill(0)
    expect(cursor).toEqual(threadArrayToCursor(arr))
  })

  let firstStopEventCursor: string | null

  test('should return cursor past the last event if no events of stop type in event-store and start with null cursor', async () => {
    await adapter.saveEvent({
      aggregateVersion: 1,
      aggregateId: 'ID_1',
      type: 'TYPE_1',
      payload: { message: 'hello' },
      timestamp: 1,
    })

    const { cursor: endCursor } = await adapter.saveEvent({
      aggregateVersion: 1,
      aggregateId: 'ID_2',
      type: 'TYPE_1',
      payload: { message: 'hello' },
      timestamp: 1,
    })

    const cursor = await adapter.getCursorUntilEventTypes(null, ['TYPE_2'])
    expect(cursor).toEqual(endCursor)
  })

  test('should return cursor to the event of stop type when starting with null cursor', async () => {
    const { cursor: endCursor } = await adapter.loadEvents({
      limit: 2,
      cursor: null,
    })

    const saveResult = await adapter.saveEvent({
      aggregateVersion: 1,
      aggregateId: 'ID_3',
      type: 'TYPE_2',
      payload: { message: 'hello' },
      timestamp: 1,
    })
    firstStopEventCursor = saveResult.cursor
    const cursor = await adapter.getCursorUntilEventTypes(null, ['TYPE_2'])
    expect(cursor).toEqual(endCursor)
  })

  test('should return cursor to the event of stop type when starting with non-null cursor', async () => {
    const { cursor: startCursor } = await adapter.loadEvents({
      limit: 2,
      cursor: null,
    })

    const cursor = await adapter.getCursorUntilEventTypes(startCursor, [
      'TYPE_2',
    ])
    expect(cursor).toEqual(startCursor)
  })

  test('should return cursor past the last event if starting with non-null cursor past the event of stop type', async () => {
    await adapter.saveEvent({
      aggregateVersion: 1,
      aggregateId: 'ID_4',
      type: 'TYPE_1',
      payload: { message: 'hello' },
      timestamp: 1,
    })

    await adapter.saveEvent({
      aggregateVersion: 1,
      aggregateId: 'ID_5',
      type: 'TYPE_1',
      payload: { message: 'hello' },
      timestamp: 1,
    })

    const { cursor: endCursor } = await adapter.loadEvents({
      limit: 5,
      cursor: null,
    })

    const cursor = await adapter.getCursorUntilEventTypes(
      firstStopEventCursor,
      ['TYPE_2']
    )
    expect(cursor).toEqual(endCursor)
  })

  test('should return cursor to the next event of stop type with cursor after the previous event of stop type', async () => {
    const { cursor: endCursor } = await adapter.loadEvents({
      limit: 5,
      cursor: null,
    })

    await adapter.saveEvent({
      aggregateVersion: 1,
      aggregateId: 'ID_6',
      type: 'TYPE_2',
      payload: { message: 'hello' },
      timestamp: 1,
    })

    const cursor = await adapter.getCursorUntilEventTypes(
      firstStopEventCursor,
      ['TYPE_2']
    )
    expect(cursor).toEqual(endCursor)
  })

  test('should return to cursor that can be used to find all next events of stop type', async () => {
    const cursor = await adapter.getCursorUntilEventTypes(null, ['TYPE_2'])
    const { events } = await adapter.loadEvents({
      cursor: cursor,
      eventTypes: ['TYPE_2'],
      limit: 8,
    })
    expect(events).toHaveLength(2)
  })
})
