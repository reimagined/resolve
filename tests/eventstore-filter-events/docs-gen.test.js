import { jestTimeout, adapterFactory, adapters } from '../eventstore-test-utils'

jest.setTimeout(jestTimeout())

describe(`${adapterFactory.name}. Eventstore adapter events filtering`, () => {
  beforeAll(adapterFactory.create('events_filter_docs_gen'))
  afterAll(adapterFactory.destroy('events_filter_docs_gen'))

  const adapter = adapters['events_filter_docs_gen']

  // mdis-start initial-events
  const initialEvents = [
    {
      type: 'LIST_CREATED',
      payload: { name: 'list-1' },
      aggregateId: 'list-1',
      aggregateVersion: 1,
    },
    {
      type: 'LIST_CREATED',
      payload: { name: 'list-2' },
      aggregateId: 'list-2',
      aggregateVersion: 1,
    },
    {
      type: 'ITEM_CREATED',
      payload: { name: 'item-1-1' },
      aggregateId: 'list-1',
      aggregateVersion: 2,
    },
    {
      type: 'ITEM_CREATED',
      payload: { name: 'item-1-2' },
      aggregateId: 'list-1',
      aggregateVersion: 3,
    },
    {
      type: 'ITEM_CREATED',
      payload: { name: 'item-2-1' },
      aggregateId: 'list-2',
      aggregateVersion: 2,
    },
  ]
  // mdis-stop initial-events

  test('should init eventstore', async () => {
    for (const {
      type,
      payload,
      aggregateId,
      aggregateVersion,
    } of initialEvents) {
      await adapter.saveEvent({
        timestamp: Date.now(),
        type,
        payload,
        aggregateId,
        aggregateVersion,
      })
    }
  })

  test('should load events works correctly', async () => {
    {
      // mdis-start load-events-1000
      const { events } = await adapter.loadEvents({
        limit: 1000,
        cursor: null,
      })
      // mdis-stop load-events-1000

      expect(events).toHaveLength(initialEvents.length)
    }

    {
      let events = []
      // mdis-start load-events-one-by-one
      let nextCursor = null
      do {
        void ({ events, cursor: nextCursor } = await adapter.loadEvents({
          limit: 1,
          cursor: nextCursor,
        }))
      } while (events.length > 0)
      // mdis-stop load-events-one-by-one
    }

    {
      // mdis-start load-events-between-time
      const { events } = await adapter.loadEvents({
        limit: Number.MAX_SAFE_INTEGER,
        startTime: Date.now() - 1000,
        endTime: Date.now(),
      })
      // mdis-stop load-events-between-time
    }

    {
      // mdis-start load-events-by-types
      const { events } = await adapter.loadEvents({
        limit: 1000,
        eventTypes: ['ITEM_CREATED'],
        cursor: null,
      })
      // mdis-stop load-events-by-types
      expect(events).toHaveLength(
        initialEvents.filter(({ type }) => type === 'ITEM_CREATED').length
      )
    }

    {
      // mdis-start load-events-by-aggregate-ids
      const { events } = await adapter.loadEvents({
        limit: 1000,
        aggregateIds: ['list-1'],
        cursor: null,
      })
      // mdis-stop load-events-by-aggregate-ids
      expect(events).toHaveLength(
        initialEvents.filter(({ aggregateId }) => aggregateId === 'list-1')
          .length
      )
    }
  })
})
