import { TestEvent } from '../types'

export const prepareEvents = (
  events: TestEvent[],
  target: 'read-model' | 'aggregate' = 'read-model',
  context?: {
    aggregateId: string
  }
): any => {
  let timestamp = 1
  const aggregateVersionsMap = new Map()
  const threadCountersMap = new Map()

  return events.map((testEvent) => {
    const aggregateId =
      target === 'aggregate' ? context?.aggregateId : testEvent.aggregateId

    const aggregateVersion = aggregateVersionsMap.has(aggregateId)
      ? aggregateVersionsMap.get(aggregateId) + 1
      : 1
    const threadId = Buffer.from(JSON.stringify(testEvent)).reduce(
      (acc, val) => (acc + val) % 256,
      0
    )
    const threadCounter = threadCountersMap.has(threadId)
      ? threadCountersMap.get(threadId) + 1
      : 1

    const event = {
      ...testEvent,
      aggregateId,
      aggregateVersion,
      timestamp: timestamp++,
      threadId,
      threadCounter,
    }

    aggregateVersionsMap.set(aggregateId, aggregateVersion)
    threadCountersMap.set(threadId, threadCounter + 1)

    return event
  })
}
