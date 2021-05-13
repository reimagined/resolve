import { Readable, pipeline } from 'stream'
import { jestTimeout, adapterFactory, adapters } from '../eventstore-test-utils'
import { promisify } from 'util'

jest.setTimeout(jestTimeout())

type Event = {
  threadCounter: number
  threadId: number
  type: string
  timestamp: number
  aggregateId: string
  aggregateVersion: number
  payload: any
}

describe(`${adapterFactory.name}. Eventstore adapter events order events`, () => {
  beforeAll(adapterFactory.create('eventstore_order_events'))
  afterAll(adapterFactory.destroy('eventstore_order_events'))

  const adapter = adapters['eventstore_order_events']

  const aggregateIds: Array<string> = []
  for (let aggregateIndex = 0; aggregateIndex < 10; aggregateIndex++) {
    aggregateIds[aggregateIndex] = `aggregate-id-${aggregateIndex}`
  }
  function getRandomAggregateId() {
    return aggregateIds[Math.floor(Math.random() * 10)]
  }

  let aggregateIdAggregateVersionMap: Record<string, number> = {}

  let lastThreadCounterById0 = 0
  let lastThreadCounterById1 = 0
  let timestamp = Date.now() + 1000 * 60 * 60

  function addSmallEvent(events: Array<Event>) {
    const threadId = 1
    const threadCounter = lastThreadCounterById1++
    const aggregateId = getRandomAggregateId()
    const aggregateVersion = ~~aggregateIdAggregateVersionMap[aggregateId] + 1
    const text = Buffer.alloc(512, 'q').toString('utf8')
    events.push({
      threadId,
      threadCounter,
      aggregateId,
      aggregateVersion,
      type: 'SMALL_EVENT',
      payload: { text },
      timestamp: timestamp++,
    })
    aggregateIdAggregateVersionMap[aggregateId] = aggregateVersion
  }

  function addLargeEvent(events: Array<Event>) {
    const threadId = 0
    const threadCounter = lastThreadCounterById0++
    const aggregateId = getRandomAggregateId()
    const aggregateVersion = ~~aggregateIdAggregateVersionMap[aggregateId] + 1
    const text = Buffer.alloc(48000, 'q').toString('utf8')
    events.push({
      threadId,
      threadCounter,
      aggregateId,
      aggregateVersion,
      type: 'LARGE_EVENT',
      payload: { text },
      timestamp: timestamp++,
    })
    aggregateIdAggregateVersionMap[aggregateId] = aggregateVersion
  }

  test('should load 0 events after initialization', async () => {
    const events: Array<Event> = []

    for (let i = 0; i < 12; i++) {
      addLargeEvent(events)
    }
    for (let i = 0; i < 1000; i++) {
      addSmallEvent(events)
    }

    const exportStream = Readable.from(
      (async function* exportStream() {
        for (const event of events) {
          yield Buffer.from(`${JSON.stringify(event)}\n`)
        }
      })()
    )

    await promisify(pipeline)(exportStream, adapter.importEvents())

    let result = []
    let cursor = null
    while (true) {
      const {
        events: currentEvents,
        cursor: nextCursor,
      } = await adapter.loadEvents({
        cursor,
        limit: 1000,
      })
      cursor = nextCursor

      if (currentEvents.length > 0) {
        result.push(...currentEvents)
      } else {
        break
      }
    }

    expect(result).toEqual(events)
  })
})
