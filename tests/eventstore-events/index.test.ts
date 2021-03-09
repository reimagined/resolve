import createSqliteAdapter from '@resolve-js/eventstore-lite'
import createPostgresqlServerlessAdapter from '@resolve-js/eventstore-postgresql-serverless'
import { Adapter } from '@resolve-js/eventstore-base'
import { create, destroy } from '@resolve-js/eventstore-postgresql-serverless'
import {
  TEST_SERVERLESS,
  updateAwsConfig,
  getCloudResourceOptions,
  jestTimeout,
  cloudResourceOptionsToAdapterConfig,
  makeTestEvent,
} from '../eventstore-test-utils'

jest.setTimeout(jestTimeout())

let createAdapter: (config: any) => Adapter

if (TEST_SERVERLESS) {
  createAdapter = createPostgresqlServerlessAdapter
} else {
  createAdapter = createSqliteAdapter
}

describe('eventstore adapter events', () => {
  if (TEST_SERVERLESS) updateAwsConfig()

  const countEvents = 100

  const options = getCloudResourceOptions('events_testing')

  let adapter: Adapter
  beforeAll(async () => {
    if (TEST_SERVERLESS) {
      await create(options)
      adapter = createAdapter(cloudResourceOptionsToAdapterConfig(options))
    } else {
      adapter = createAdapter({})
    }
    await adapter.init()
  })

  afterAll(async () => {
    await adapter.drop()
    await adapter.dispose()

    if (TEST_SERVERLESS) {
      await destroy(options)
    }
  })

  test('should load 0 events after initialization', async () => {
    const { events } = await adapter.loadEvents({
      limit: countEvents,
      cursor: null,
    })
    expect(events).toHaveLength(0)
  })

  test('should save events', async () => {
    for (let eventIndex = 0; eventIndex < countEvents; eventIndex++) {
      const event = makeTestEvent(eventIndex)
      await adapter.saveEvent(event)
    }
  })

  test('should load all requested events', async () => {
    const { events } = await adapter.loadEvents({
      limit: countEvents + 1,
      cursor: null,
    })
    expect(events).toHaveLength(countEvents)
  })

  test('should load events by type', async () => {
    const { events } = await adapter.loadEvents({
      limit: countEvents,
      eventTypes: ['EVENT'],
      cursor: null,
    })
    expect(events).toHaveLength(countEvents)
  })

  test('should load 0 events by unknown type', async () => {
    const { events } = await adapter.loadEvents({
      limit: countEvents,
      eventTypes: ['UNKNOWN'],
      cursor: null,
    })
    expect(events).toHaveLength(0)
  })

  test('should load events by aggregateId', async () => {
    const { events } = await adapter.loadEvents({
      limit: countEvents,
      aggregateIds: ['aggregateId'],
      cursor: null,
    })
    expect(events).toHaveLength(countEvents)
  })

  test('should load 0 events by unknown aggregateId', async () => {
    const { events } = await adapter.loadEvents({
      limit: countEvents,
      aggregateIds: ['unknownId'],
      cursor: null,
    })
    expect(events).toHaveLength(0)
  })

  test('should be able to load events continuously', async () => {
    const requestedCount = countEvents / 2
    const { events, cursor } = await adapter.loadEvents({
      limit: requestedCount,
      cursor: null,
    })
    expect(events).toHaveLength(requestedCount)

    const loadResult = await adapter.loadEvents({
      cursor: cursor,
      limit: countEvents,
    })
    expect(loadResult.events).toHaveLength(countEvents - requestedCount)
    const emptyResult = await adapter.loadEvents({
      cursor: loadResult.cursor,
      limit: countEvents,
    })
    expect(emptyResult.events).toHaveLength(0)
  })
})

describe('eventstore adapter events filtering', () => {
  if (TEST_SERVERLESS) updateAwsConfig()

  const countEvents = 120

  const options = getCloudResourceOptions('events_filter_testing')
  const eventTypesCount = 4
  const aggregateIdCount = 5

  let adapter: Adapter
  beforeAll(async () => {
    if (TEST_SERVERLESS) {
      await create(options)
      adapter = createAdapter(cloudResourceOptionsToAdapterConfig(options))
    } else {
      adapter = createAdapter({})
    }
    await adapter.init()
  })

  afterAll(async () => {
    await adapter.drop()
    await adapter.dispose()

    if (TEST_SERVERLESS) {
      await destroy(options)
    }
  })

  test('should save events with different aggregate ids and types', async () => {
    for (let eventIndex = 0; eventIndex < countEvents; eventIndex++) {
      const event = {
        aggregateId: `aggregateId_${1 + (eventIndex % aggregateIdCount)}`,
        aggregateVersion: eventIndex + 1,
        type: `EVENT_${1 + (eventIndex % eventTypesCount)}`,
        payload: { eventIndex },
        timestamp: eventIndex + 1,
      }
      await adapter.saveEvent(event)
    }
  })

  test('should load events by distinct event types', async () => {
    const { events } = await adapter.loadEvents({
      limit: countEvents,
      eventTypes: ['EVENT_1', 'EVENT_3'],
      cursor: null,
    })
    expect(events).toHaveLength(countEvents / 2)
    for (let eventIndex = 0; eventIndex < events.length; ++eventIndex) {
      const event = events[eventIndex]
      expect(event.type === 'EVENT_1' || event.type === 'EVENT_3').toBeTruthy()
      if (event.type === 'EVENT_1') {
        expect(event.payload.eventIndex % eventTypesCount).toEqual(0)
      } else if (event.type === 'EVENT_3') {
        expect(event.payload.eventIndex % eventTypesCount).toEqual(2)
      }
    }
  })

  test('should load events by distinct aggregate ids', async () => {
    const { events } = await adapter.loadEvents({
      limit: countEvents,
      aggregateIds: ['aggregateId_2', 'aggregateId_4'],
      cursor: null,
    })
    expect(events).toHaveLength((countEvents / aggregateIdCount) * 2)
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
  })

  test('should load events by combination of distinct event types and aggregate ids', async () => {
    const { events } = await adapter.loadEvents({
      limit: countEvents,
      aggregateIds: ['aggregateId_1', 'aggregateId_5'],
      eventTypes: ['EVENT_1', 'EVENT_4'],
      cursor: null,
    })
    expect(events).toHaveLength(
      (countEvents / (aggregateIdCount * eventTypesCount)) * 4
    )
    for (let eventIndex = 0; eventIndex < events.length; ++eventIndex) {
      const event = events[eventIndex]
      expect(event.type === 'EVENT_1' || event.type === 'EVENT_4').toBeTruthy()
      expect(
        event.aggregateId === 'aggregateId_1' ||
          event.aggregateId === 'aggregateId_5'
      ).toBeTruthy()
    }
  })
})
