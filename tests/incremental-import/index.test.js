import createEventStoreAdapter from 'resolve-eventstore-lite'
jest.setTimeout(1000 * 60)

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
  const countInitialEvents = 250 + Math.floor(750 * Math.random())
  const countIncrementalImportEvents = 250 + Math.floor(750 * Math.random())
  const countAllEvents = countInitialEvents + countIncrementalImportEvents

  const adapter = createEventStoreAdapter({
    databaseFile: ':memory:',
    secretsFile: ':memory:'
  })

  await adapter.init()

  for (let eventIndex = 0; eventIndex < countInitialEvents; eventIndex++) {
    await adapter.saveEvent({
      aggregateId: `aggregateId${eventIndex % 10}`,
      aggregateVersion: Math.floor(eventIndex / 10) + 1,
      type: `EVENT${eventIndex % 3}`,
      payload: { eventIndex },
      timestamp: Date.now()
    })
  }

  await new Promise(resolve => setTimeout(resolve, 1000))

  const incrementalImportTimestamp = Date.now()

  const incrementalImportEvents = []
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
  }
  shuffle(incrementalImportEvents)

  const importId = await adapter.beginIncrementalImport()

  await adapter.pushIncrementalImport(incrementalImportEvents, importId)

  await adapter.commitIncrementalImport(importId)

  const resultEvents = (await adapter.loadEvents({ limit: countAllEvents + 1 }))
    .events

  expect(resultEvents.length).toEqual(countAllEvents)

  validateEvents(resultEvents)
})
