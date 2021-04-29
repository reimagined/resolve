import { TestEvent } from '../types'

export const prepareEvents = (
  events: TestEvent[],
  context?: {
    aggregateId: string
  }
): any => {
  let timestamp = Date.now() + 60 * 1000
  const aggregateVersionsMap = new Map()

  return events.map((testEvent) => {
    const aggregateId =
      testEvent.aggregateId != null
        ? testEvent.aggregateId
        : context?.aggregateId

    const aggregateVersion = aggregateVersionsMap.has(aggregateId)
      ? aggregateVersionsMap.get(aggregateId) + 1
      : 1

    const event = {
      ...testEvent,
      aggregateId,
      aggregateVersion,
      timestamp: timestamp++,
    }

    aggregateVersionsMap.set(aggregateId, aggregateVersion)

    return event
  })
}
