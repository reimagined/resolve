import { adapterFactory, adapters, jestTimeout } from '../eventstore-test-utils'

jest.setTimeout(jestTimeout())

beforeAll(adapterFactory.create('save_and_load_testing'))
afterAll(adapterFactory.destroy('save_and_load_testing'))

const adapter = adapters['save_and_load_testing']

test(`${adapterFactory.name}. Eventstore adapter should be able to save and load an event`, async () => {
  await adapter.saveEvent({
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
})
