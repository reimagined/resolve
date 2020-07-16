import { promisify } from 'util'
import { Readable, pipeline as rawPipeline } from 'stream'

import createAdapter from './create-adapter'

const pipeline = promisify(rawPipeline)

jest.setTimeout(10000 * 60 * 1000)

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

test('inject-events should work correctly', async () => {
  const countInitialEvents = 250 + Math.floor(75 * Math.random())
  const countIncrementalImportEvents = 25000 + Math.floor(75 * Math.random())
  const countAllEvents = countInitialEvents + countIncrementalImportEvents

  const adapter = createAdapter()

  await adapter.init()

  const initialEvents = []
  for (let eventIndex = 0; eventIndex < countInitialEvents; eventIndex++) {
    initialEvents.push({
      threadId: eventIndex % 256,
      threadCounter: Math.floor(eventIndex / 256),
      aggregateId: `aggregateId${eventIndex % 10}`,
      aggregateVersion: Math.floor(eventIndex / 10) + 1,
      type: `EVENT${eventIndex % 3}`,
      payload: { eventIndex },
      timestamp: Date.now()
    })
  }

  const t0 = Date.now()

  await pipeline(
    Readable.from(
      (async function* eventStream() {
        for (const event of initialEvents) {
          yield Buffer.from(`${JSON.stringify(event)}\n`)
        }
      })()
    ),
    adapter.import()
  )

  const t1 = Date.now()
  await new Promise(resolve => setImmediate(resolve))

  // eslint-disable-next-line no-console
  console.log(
    `Importing initial events ${t1 - t0} ms / Events ${countInitialEvents}`
  )

  const tempInitialEvents = (
    await adapter.loadEvents({ limit: countInitialEvents + 1 })
  ).events
  expect(tempInitialEvents.length).toEqual(initialEvents.length)
  expect(tempInitialEvents).toEqual(initialEvents)

  await new Promise(resolve => setTimeout(resolve, 1000))

  const incrementalImportTimestamp = Date.now()
  let incrementalImportEvents = []

  const t2 = Date.now()

  const importId = await adapter.beginIncrementalImport()
  const incrementalImportPromises = []
  let incrementalBatchIdx = 0

  for (
    let eventIndex = 0;
    eventIndex < countIncrementalImportEvents;
    eventIndex++
  ) {
    incrementalImportEvents.push({
      aggregateId: `aggregateId${eventIndex % 10}`,
      type: `EVENT${eventIndex % 3}`,
      timestamp: incrementalImportTimestamp + eventIndex,
      payload: { eventIndex }
    })

    if (eventIndex % 4096 === 0) {
      shuffle(incrementalImportEvents)
      const currentBatchIdx = incrementalBatchIdx++
      incrementalImportPromises.push(
        adapter
          .pushIncrementalImport(incrementalImportEvents, importId)
          .then(() => {
            // eslint-disable-next-line no-console
            console.log(`Pushing incremental batch ${currentBatchIdx}`)
          })
      )

      incrementalImportEvents = []
    }
  }

  if (incrementalImportEvents.length > 0) {
    const currentBatchIdx = incrementalBatchIdx++
    shuffle(incrementalImportEvents)
    incrementalImportPromises.push(
      adapter
        .pushIncrementalImport(incrementalImportEvents, importId)
        .then(() => {
          // eslint-disable-next-line no-console
          console.log(`Pushing incremental batch ${currentBatchIdx}`)
        })
    )
  }

  await Promise.all(incrementalImportPromises)

  const t3 = Date.now()
  await new Promise(resolve => setImmediate(resolve))

  // eslint-disable-next-line no-console
  console.log(
    `Pushing incremental events ${t3 -
      t2} ms / Events ${countIncrementalImportEvents}`
  )

  await adapter.commitIncrementalImport(importId, true)

  const t4 = Date.now()
  await new Promise(resolve => setImmediate(resolve))

  // eslint-disable-next-line no-console
  console.log(
    `Commiting incremental events ${t4 -
      t3} ms / Events ${countIncrementalImportEvents}`
  )

  const resultEvents = (await adapter.loadEvents({ limit: countAllEvents + 1 }))
    .events

  expect(resultEvents.length).toEqual(countAllEvents)

  validateEvents(resultEvents)
})
