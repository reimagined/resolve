import { decodeEvent } from 'resolve-storage-dynamo'

const handleApplyEvents = async (lambdaEvent, resolve) => {
  const { events, listenerId } = lambdaEvent
  const result = await resolve.executeQuery.updateByEvents(
    listenerId,
    events.map(decodeEvent)
  )
  return result
}

const handleEventBusEvent = async (lambdaEvent, resolve) => {
  switch (lambdaEvent['detail-type']) {
    case 'APPLY_EVENTS_FROM_EVENT_BUS': {
      return await handleApplyEvents(lambdaEvent, resolve)
    }
    default: {
      return null
    }
  }
}

export default handleEventBusEvent
