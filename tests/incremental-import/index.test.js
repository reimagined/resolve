import { promisify } from 'util'
import { Readable, pipeline as rawPipeline } from 'stream'

import createAdapter from './create-adapter'

const pipeline = promisify(rawPipeline)

jest.setTimeout(1000 * 60 * 5)

function shuffle(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    void ([array[i], array[j]] = [array[j], array[i]])
  }
  return array
}

function validateEvents(events) {
  const aggregateIdVersionMap = {}
  const threadIdCounterMap = {}
  const threadIdTimestampMap = {}
  let maxTimestamp = -1
  const allErrors = []
  for (const event of events) {
    const errors = []

    if (event.threadId == null) {
      errors.push(new Error('Incorrect "threadId"'))
    }
    const expectedAggregateVersion =
      (aggregateIdVersionMap[event.aggregateId] == null
        ? 0
        : aggregateIdVersionMap[event.aggregateId]) + 1
    if (
      event.aggregateVersion == null ||
      event.aggregateVersion !== expectedAggregateVersion
    ) {
      // eslint-disable-next-line no-console
      console.log('event.aggregateVersion', event.aggregateVersion)
      // eslint-disable-next-line no-console
      console.log(
        'aggregateIdVersionMap[event.aggregateId]',
        aggregateIdVersionMap[event.aggregateId]
      )
      // eslint-disable-next-line no-console
      console.log('expectedAggregateVersion', expectedAggregateVersion)
      // eslint-disable-next-line no-console
      console.log('aggregateId', event.aggregateId)
      errors.push(new Error('Incorrect "aggregateVersion"'))
    } else {
      aggregateIdVersionMap[event.aggregateId] = event.aggregateVersion
    }
    const expectedThreadCounter =
      (threadIdCounterMap[event.threadId] == null
        ? -1
        : threadIdCounterMap[event.threadId]) + 1
    if (
      event.threadCounter == null ||
      event.threadCounter !== expectedThreadCounter
    ) {
      // eslint-disable-next-line no-console
      console.log('event.threadCounter', event.threadCounter)
      // eslint-disable-next-line no-console
      console.log(
        'threadIdCounterMap[event.threadId]',
        threadIdCounterMap[event.threadId]
      )
      // eslint-disable-next-line no-console
      console.log('expectedThreadCounter', expectedThreadCounter)
      // eslint-disable-next-line no-console
      console.log('threadId', event.threadId)
      errors.push(new Error('Incorrect "threadCounter"'))
    } else {
      threadIdCounterMap[event.threadId] = event.threadCounter
    }
    const expectedTimestamp =
      threadIdTimestampMap[event.threadId] == null
        ? 0
        : threadIdTimestampMap[event.threadId]
    if (event.timestamp == null || event.timestamp < expectedTimestamp) {
      // eslint-disable-next-line no-console
      console.log('event.timestamp', event.timestamp)
      // eslint-disable-next-line no-console
      console.log(
        'threadIdTimestampMap[event.threadId]',
        threadIdTimestampMap[event.threadId]
      )
      // eslint-disable-next-line no-console
      console.log('expectedTimestamp', expectedTimestamp)
      // eslint-disable-next-line no-console
      console.log('threadId', event.threadId)
      errors.push(new Error('Incorrect "timestamp"'))
    } else {
      threadIdTimestampMap[event.threadId] = event.timestamp
    }
    if (event.timestamp == null || event.timestamp < maxTimestamp) {
      // eslint-disable-next-line no-console
      console.log('event.timestamp', event.timestamp)
      // eslint-disable-next-line no-console
      console.log('maxTimestamp', maxTimestamp)
      errors.push(new Error('Incorrect "timestamp"'))
    } else {
      maxTimestamp = event.timestamp
    }
    if (errors.length > 0) {
      allErrors.push(...errors)
    }
  }

  if (allErrors.length > 0) {
    // eslint-disable-next-line no-console
    console.log('aggregateIdVersionMap', aggregateIdVersionMap)
    // eslint-disable-next-line no-console
    console.log('threadIdCounterMap', threadIdCounterMap)

    const error = new Error(allErrors.map(({ message }) => message).join('\n'))
    error.stack = allErrors.map(({ stack }) => stack).join('\n')
    throw error
  }
}

let adapter = null

beforeEach(async () => {
  adapter = createAdapter()
  await adapter.init()
})

afterEach(async () => {
  if (adapter != null) {
    await adapter.drop()
    await adapter.dispose()
    adapter = null
  }
})

test('incremental import should work correctly', async () => {
  const countEvents = 2500 + Math.floor(75 * Math.random())
  const events = []

  for (let eventIndex = 0; eventIndex < countEvents; eventIndex++) {
    events.push({
      aggregateId: `aggregateId${eventIndex % 10}`,
      type: `EVENT${eventIndex % 3}`,
      payload: { eventIndex },
      timestamp: Date.now(),
    })
  }

  await adapter.incrementalImport(events)

  const resultEvents = (
    await adapter.loadEvents({ limit: countEvents + 1, cursor: null })
  ).events

  expect(resultEvents.length).toEqual(countEvents)

  validateEvents(resultEvents)
})

test('inject-events should work correctly', async () => {
  const countInitialEvents = 250 + Math.floor(75 * Math.random())
  const countIncrementalImportEvents = 25000 + Math.floor(75000 * Math.random())
  const countAllEvents = countInitialEvents + countIncrementalImportEvents

  const initialEvents = []
  for (let eventIndex = 0; eventIndex < countInitialEvents; eventIndex++) {
    initialEvents.push({
      threadId: eventIndex % 256,
      threadCounter: Math.floor(eventIndex / 256),
      aggregateId: `aggregateId${eventIndex % 10}`,
      aggregateVersion: Math.floor(eventIndex / 10) + 1,
      type: `EVENT${eventIndex % 3}`,
      payload: { eventIndex },
      timestamp: Date.now(),
    })
  }

  // const t0 = Date.now()

  await pipeline(
    Readable.from(
      (async function* eventStream() {
        for (const event of initialEvents) {
          yield Buffer.from(`${JSON.stringify(event)}\n`)
        }
      })()
    ),
    adapter.importEvents()
  )

  // const t1 = Date.now()
  await new Promise((resolve) => setImmediate(resolve))

  // // eslint-disable-next-line no-console
  // console.log(
  //   `Importing initial events ${t1 - t0} ms / Events ${countInitialEvents}`
  // )

  const tempInitialEvents = (
    await adapter.loadEvents({ limit: countInitialEvents + 1, cursor: null })
  ).events
  expect(tempInitialEvents.length).toEqual(initialEvents.length)
  expect(tempInitialEvents).toEqual(initialEvents)

  await new Promise((resolve) => setTimeout(resolve, 1000))

  const incrementalImportTimestamp = Date.now()
  let incrementalImportEvents = []

  // const t2 = Date.now()

  const importId = await adapter.beginIncrementalImport()
  const incrementalImportPromises = []
  // let incrementalBatchIdx = 0

  for (
    let eventIndex = 0;
    eventIndex < countIncrementalImportEvents;
    eventIndex++
  ) {
    incrementalImportEvents.push({
      aggregateId: `aggregateId${eventIndex % 10}`,
      type: `EVENT${eventIndex % 3}`,
      timestamp: incrementalImportTimestamp + eventIndex,
      payload: { eventIndex },
    })

    if (eventIndex % 256 === 0) {
      shuffle(incrementalImportEvents)
      //const currentBatchIdx = incrementalBatchIdx++
      incrementalImportPromises.push(
        adapter.pushIncrementalImport(incrementalImportEvents, importId)
        // .then(() => {
        //   // eslint-disable-next-line no-console
        //   console.log(`Pushing incremental batch ${currentBatchIdx}`)
        // })
      )

      incrementalImportEvents = []
    }
  }

  if (incrementalImportEvents.length > 0) {
    // const currentBatchIdx = incrementalBatchIdx++
    shuffle(incrementalImportEvents)
    incrementalImportPromises.push(
      adapter.pushIncrementalImport(incrementalImportEvents, importId)
      // .then(() => {
      //   // eslint-disable-next-line no-console
      //   console.log(`Pushing incremental batch ${currentBatchIdx}`)
      // })
    )
  }

  await Promise.all(incrementalImportPromises)

  // const t3 = Date.now()
  await new Promise((resolve) => setImmediate(resolve))

  // // eslint-disable-next-line no-console
  // console.log(
  //   `Pushing incremental events ${t3 -
  //     t2} ms / Events ${countIncrementalImportEvents}`
  // )

  await adapter.commitIncrementalImport(importId, true)

  // const t4 = Date.now()
  await new Promise((resolve) => setImmediate(resolve))

  // // eslint-disable-next-line no-console
  // console.log(
  //   `Commiting incremental events ${t4 -
  //     t3} ms / Events ${countIncrementalImportEvents}`
  // )

  const resultEvents = (
    await adapter.loadEvents({ limit: countAllEvents + 1, cursor: null })
  ).events

  expect(resultEvents.length).toEqual(countAllEvents)

  validateEvents(resultEvents)
})

test('inject-events should work correctly with retries', async () => {
  const countInitialEvents = 250 + Math.floor(750 * Math.random())

  const initialEvents = []
  const incrementalImportEvents = []

  for (let eventIndex = 0; eventIndex < countInitialEvents; eventIndex++) {
    const timestamp = Date.now()
    const type = `EVENT${eventIndex % 3}`
    const aggregateId = `aggregateId${eventIndex % 10}`

    if (eventIndex < countInitialEvents * 0.66) {
      initialEvents.push({
        threadId: eventIndex % 256,
        threadCounter: Math.floor(eventIndex / 256),
        aggregateId,
        aggregateVersion: Math.floor(eventIndex / 10) + 1,
        type,
        payload: { eventIndex },
        timestamp,
      })
    }
    if (eventIndex > countInitialEvents * 0.33) {
      incrementalImportEvents.push({
        threadId: eventIndex % 256,
        threadCounter: Math.floor(eventIndex / 256),
        aggregateId,
        aggregateVersion: Math.floor(eventIndex / 10) + 1,
        type,
        payload: { eventIndex },
        timestamp,
      })
    }
  }

  await pipeline(
    Readable.from(
      (async function* eventStream() {
        for (const event of initialEvents) {
          yield Buffer.from(`${JSON.stringify(event)}\n`)
        }
      })()
    ),
    adapter.importEvents()
  )

  await new Promise((resolve) => setImmediate(resolve))

  const tempInitialEvents = (
    await adapter.loadEvents({ limit: countInitialEvents + 1, cursor: null })
  ).events
  expect(tempInitialEvents.length).toEqual(initialEvents.length)
  expect(tempInitialEvents).toEqual(initialEvents)

  await new Promise((resolve) => setTimeout(resolve, 1000))

  const importId = await adapter.beginIncrementalImport()

  await adapter.pushIncrementalImport(incrementalImportEvents, importId)

  await new Promise((resolve) => setImmediate(resolve))

  await adapter.commitIncrementalImport(importId, true)
})

test('preserve order of input events with the same timestamp', async () => {
  async function orderCheck() {
    for (
      let aggregateIndex = 0;
      aggregateIndex < aggregateCount;
      aggregateIndex++
    ) {
      const aggregateId = aggregateIds[aggregateIndex]
      const { events } = await adapter.loadEvents({
        cursor: null,
        limit: 10000,
        aggregateIds: [aggregateId],
      })
      for (let index = 0; index < events.length - 1; index++) {
        const nextIndex = index + 1
        if (
          events[nextIndex].aggregateVersion !==
          events[index].aggregateVersion + 1
        ) {
          throw new Error(
            `Bad order. aggregateId = ${aggregateId}. ${JSON.stringify(
              events,
              null,
              2
            )}`
          )
        }
      }
    }
  }

  const aggregateCount = 5
  const timestampCount = 7

  const aggregateIds = Array.from(Array(aggregateCount).keys()).map(
    (id) => `id_${id}`
  )
  const aggregateVersions = aggregateIds.reduce((acc, val) => {
    acc[val] = 0
    return acc
  }, {})

  const threadCounters = Array.from(Array(256).keys())
    .map((_, index) => index)
    .reduce((acc, val) => {
      acc[val] = 0
      return acc
    }, {})

  const initialEvents = []

  let eventIndex = 0
  for (
    let aggregateIndex = 0;
    aggregateIndex < aggregateCount;
    aggregateIndex++
  ) {
    for (
      let timestampIndex = 0;
      timestampIndex < timestampCount;
      timestampIndex++
    ) {
      eventIndex++

      const aggregateId = aggregateIds[aggregateIndex]
      const aggregateVersion = ++aggregateVersions[aggregateId]
      const timestamp = eventIndex
      const threadId = (eventIndex * aggregateCount * timestampCount) % 256
      const threadCounter = threadCounters[threadId]++

      initialEvents.push({
        threadId,
        threadCounter,
        aggregateId,
        aggregateVersion,
        timestamp,
        type: 'type',
        payload: {},
      })
    }
  }

  await pipeline(
    Readable.from(
      (async function* eventStream() {
        for (const event of initialEvents) {
          yield Buffer.from(`${JSON.stringify(event)}\n`)
        }
      })()
    ),
    adapter.importEvents()
  )

  await orderCheck()

  const incrementalEvents = [
    {
      timestamp: 1626110770000,
      aggregateId: aggregateIds[0],
      type: 'type',
      payload: { idx: 0 },
    },
    {
      timestamp: 1626110770000,
      aggregateId: aggregateIds[0],
      type: 'type',
      payload: { idx: 1 },
    },
    {
      timestamp: 1626132179642,
      aggregateId: aggregateIds[0],
      type: 'type',
      payload: { idx: 2 },
    },
    {
      timestamp: 1626132179642,
      aggregateId: aggregateIds[0],
      type: 'type',
      payload: { idx: 3 },
    },
    {
      timestamp: 1626132179642,
      aggregateId: aggregateIds[0],
      type: 'type',
      payload: { idx: 4 },
    },
    {
      timestamp: 1626132179642,
      aggregateId: aggregateIds[0],
      type: 'type',
      payload: { idx: 5 },
    },
  ]

  await adapter.incrementalImport(incrementalEvents)

  await orderCheck()
})
