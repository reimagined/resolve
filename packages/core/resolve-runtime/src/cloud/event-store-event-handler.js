import { detectConnectorFeatures, INLINE_LEDGER_CONNECTOR } from 'resolve-query'

const handleEventStoreEvent = async (lambdaEvent, resolve) => {
  switch (lambdaEvent.method) {
    case 'SaveEvent': {
      const result = await resolve.eventstoreAdapter.saveEvent(
        lambdaEvent.payload.event
      )
      await resolve.notifyInlineLedgers()
      return result
    }
    case 'LoadEvents': {
      const { events, cursor } = await resolve.eventstoreAdapter.loadEvents({
        eventTypes: lambdaEvent.payload.eventTypes,
        aggregateIds: lambdaEvent.payload.aggregateIds,
        limit: lambdaEvent.payload.limit,
        eventsSizeLimit: lambdaEvent.payload.eventsSizeLimit,
        cursor: lambdaEvent.payload.cursor
      })
      return { cursor, events }
    }
    default: {
      throw new Error(`Invalid event: ${JSON.stringify(lambdaEvent)}`)
    }
  }
}

export default handleEventStoreEvent
