import {
  adapterFactory,
  adapters,
  jestTimeout,
  makeTestEvent,
} from '../eventstore-test-utils'

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
