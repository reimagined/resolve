import {
  adapterFactory,
  adapters,
  jestTimeout,
  makeTypedTestEvent,
  isPostgres,
  collectPostgresStatistics,
} from '../eventstore-test-utils'

import {
  ConcurrentError,
  threadArrayToCursor,
  checkEventsContinuity,
  initThreadArray,
} from '@resolve-js/eventstore-base'

import type {
  StoredEventPointer,
  StoredEvent,
} from '@resolve-js/eventstore-base'

jest.setTimeout(jestTimeout())

describe(`${adapterFactory.name}. Eventstore adapter events saving and loading`, () => {
  beforeAll(adapterFactory.create('save_and_load_testing'))
  afterAll(adapterFactory.destroy('save_and_load_testing'))

  const adapter = adapters['save_and_load_testing']

  let eventCursorPairs: StoredEventPointer[] = []

  test('should load 0 events after initialization', async () => {
    const { events } = await adapter.loadEvents({
      limit: 100,
      cursor: null,
    })
    expect(events).toHaveLength(0)

    const description = await adapter.describe({ calculateCursor: true })
    expect(description.eventCount).toEqual(0)
    expect(description.cursor).toEqual(threadArrayToCursor(initThreadArray()))

    const lastEvent = await adapter.getLatestEvent({})
    expect(lastEvent).toBeNull()
  })

  const eventTypes = ['EVENT_1', 'EVENT_2', 'EVENT_3', 'EVENT_4'] as const
  const checkCount = eventTypes.length * 128

  test('should save all passed events', async () => {
    for (let i = 0; i < checkCount; ++i) {
      const event = makeTypedTestEvent(i, eventTypes[i % 4])
      const saveResult = await adapter.saveEvent(event)

      expect(saveResult.event.type).toEqual(event.type)
      expect(saveResult.event.aggregateId).toEqual(event.aggregateId)
      expect(saveResult.event.payload).toEqual(event.payload)
      expect(saveResult.event.timestamp).toBeGreaterThan(0)

      eventCursorPairs.push(saveResult)
      // hack for sqlite - it might save events too fast, but we want to ensure different timestamps
      if (Date.now() === saveResult.event.timestamp) {
        await new Promise((resolve) => {
          setTimeout(resolve, 1)
        })
      }
    }
    expect(eventCursorPairs).toHaveLength(checkCount)
    eventCursorPairs.sort((a, b) => {
      return Math.sign(
        Math.sign(a.event.timestamp - b.event.timestamp) * 100 +
          Math.sign(a.event.threadCounter - b.event.threadCounter) * 10 +
          Math.sign(a.event.threadId - b.event.threadId)
      )
    })

    const description = await adapter.describe()
    expect(description.eventCount).toEqual(checkCount)

    if (isPostgres()) {
      await collectPostgresStatistics('save_and_load_testing')
      expect(
        (await adapter.describe({ estimateCounts: true })).eventCount
      ).toEqual(checkCount)
    }
  })

  test('should throw ConcurrentError when saving event with the same aggregateVersion', async () => {
    await expect(
      adapter.saveEvent(makeTypedTestEvent(0, eventTypes[0]))
    ).rejects.toThrow(ConcurrentError)
  })

  test('saved events and corresponding cursors must match the subsequent loadEvents result', async () => {
    let currentCursor = null
    let loadedEvents: StoredEvent[] = []
    const step = 100
    for (let i = 0; i < checkCount; i += step) {
      const { events, cursor: nextCursor } = await adapter.loadEvents({
        limit: step,
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

  async function testEventLoading(
    startingPosition = 0,
    eventTypes: Array<string> | null = null
  ) {
    let initialCursor: string | null = null
    if (startingPosition > 0) {
      const { cursor } = await adapter.loadEvents({
        cursor: null,
        limit: startingPosition,
      })
      initialCursor = cursor
    }

    const expectedCount = (checkCount - startingPosition) / eventTypes.length

    let currentCursor = initialCursor
    const step = 100

    const eventLoader = await adapter.getEventLoader({
      eventTypes,
      cursor: currentCursor,
    })

    let loadedEventCount = 0
    let readEventCount = 0
    for (let i = 0; i < expectedCount; i += step) {
      const {
        events: loadedEvents,
        cursor: nextCursor,
      } = await adapter.loadEvents({
        limit: step,
        cursor: currentCursor,
        eventTypes,
      })

      const {
        events: readEvents,
        cursor: nextReadCursor,
      } = await eventLoader.loadEvents(step)

      loadedEventCount += loadedEvents.length
      readEventCount += readEvents.length
      expect(readEventCount).toEqual(loadedEventCount)
      expect(nextReadCursor).toEqual(nextCursor)
      expect(eventLoader.cursor).toEqual(nextReadCursor)

      for (let i = 0; i < loadedEventCount; ++i) {
        expect(readEvents[i]).toEqual(loadedEvents[i])
      }

      currentCursor = nextCursor
    }

    const isNative = eventLoader.isNative
    await eventLoader.close()

    expect(loadedEventCount).toEqual(expectedCount)
    expect(readEventCount).toEqual(expectedCount)

    if (isPostgres()) {
      expect(isNative).toBe(true)
    }
  }

  test('should load events consequentially from the beginning', async () => {
    await testEventLoading(0, [eventTypes[1], eventTypes[3]])
  })

  test('should load events consequentially from the middle', async () => {
    await testEventLoading(checkCount / 2, [eventTypes[0], eventTypes[2]])
  })

  test('preferring regular event loader should return non-native one', async () => {
    const eventLoader = await adapter.getEventLoader(
      { cursor: null },
      { preferRegular: true }
    )
    const isNative = eventLoader.isNative
    await eventLoader.close()
    expect(isNative).toBe(false)
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
    expect(
      checkEventsContinuity(
        eventCursorPairs[middleIndex].cursor,
        eventCursorPairs.slice(middleIndex + 1)
      )
    ).toBe(true)
  })

  test('consequentially saved events are continuous regardless the order in array', async () => {
    expect(
      checkEventsContinuity(null, [eventCursorPairs[1], eventCursorPairs[0]])
    ).toBe(true)

    expect(
      checkEventsContinuity(eventCursorPairs[0].cursor, [
        eventCursorPairs[2],
        eventCursorPairs[1],
      ])
    ).toBe(true)
  })

  test('many events saved in parallel should be continuous', async () => {
    const parallelWrites = 100
    const promises: Promise<StoredEventPointer>[] = []
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
    const parallelEventCursorPairs: StoredEventPointer[] = await Promise.all(
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
    const arr = initThreadArray()
    expect(cursor).toEqual(threadArrayToCursor(arr))
  })

  let firstStopEventCursor: string | null

  test('should return cursor past the last event if there no events of stop type in event-store', async () => {
    const { cursor: firstCursor } = await adapter.saveEvent({
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
    const cursor2 = await adapter.getCursorUntilEventTypes(firstCursor, [
      'TYPE_2',
    ])
    expect(cursor2).toEqual(endCursor)
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
    const { cursor: firstCursor } = await adapter.loadEvents({
      limit: 1,
      cursor: null,
    })

    const { cursor: endCursor } = await adapter.loadEvents({
      limit: 2,
      cursor: null,
    })

    const cursor = await adapter.getCursorUntilEventTypes(firstCursor, [
      'TYPE_2',
    ])
    expect(cursor).toEqual(endCursor)
    const cursor2 = await adapter.getCursorUntilEventTypes(endCursor, [
      'TYPE_2',
    ])
    expect(cursor2).toEqual(endCursor)
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
