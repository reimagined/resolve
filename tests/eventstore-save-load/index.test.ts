import {
  adapterFactory,
  adapters,
  jestTimeout,
  makeTestEvent,
} from '../eventstore-test-utils'

import {
  threadArrayToCursor,
  cursorToThreadArray,
  THREAD_COUNT,
} from '@resolve-js/eventstore-base'

jest.setTimeout(jestTimeout())

describe(`${adapterFactory.name}. Eventstore adapter events saving and loading`, () => {
  beforeAll(adapterFactory.create('save_and_load_testing'))
  afterAll(adapterFactory.destroy('save_and_load_testing'))

  const adapter = adapters['save_and_load_testing']

  test('should be able to save and load an event', async () => {
    const returnedCursor = await adapter.saveEvent({
      aggregateVersion: 1,
      aggregateId: 'ID_1',
      type: 'TYPE_1',
      payload: { message: 'hello' },
      timestamp: 1,
    })
    const { events, cursor } = await adapter.loadEvents({
      eventTypes: null,
      aggregateIds: null,
      limit: 1,
      cursor: null,
    })
    expect(events).toHaveLength(1)
    expect(events[0].type).toEqual('TYPE_1')
    expect(events[0].payload).toEqual({ message: 'hello' })
    expect(events[0].timestamp).toBeGreaterThan(0)
    expect(typeof cursor).toBe('string')
    expect(returnedCursor).toEqual(cursor)
  })

  test('should be able to save many events and returned cursors must match the subsequent loadEvents cursor', async () => {
    const checkCount = 16

    for (let i = 0; i < checkCount; ++i) {
      const event = makeTestEvent(i)
      const nextCursor = await adapter.saveEvent(event)
      const { events, cursor } = await adapter.loadEvents({
        limit: checkCount + 1,
        cursor: null,
      })
      expect(nextCursor).toEqual(cursor)
      expect(events).toHaveLength(i + 2)
    }
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

    const endCursor = await adapter.saveEvent({
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

    firstStopEventCursor = await adapter.saveEvent({
      aggregateVersion: 1,
      aggregateId: 'ID_3',
      type: 'TYPE_2',
      payload: { message: 'hello' },
      timestamp: 1,
    })
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
