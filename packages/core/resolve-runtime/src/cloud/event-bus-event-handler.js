import { decodeEvent } from 'resolve-storage-dynamo'
import debugLevels from 'debug-levels'

const log = debugLevels('resolve:resolve-runtime:event-bus-event-handler')

const handleApplyEvents = async (lambdaEvent, resolve) => {
  const segment = resolve.performanceTracer.getSegment()
  const subSegment = segment.addNewSubsegment('applyEventsFromBus')

  const { events, properties, listenerId } = lambdaEvent

  log.debug('applying events started')
  log.verbose(JSON.stringify({ listenerId, properties }, null, 2))

  resolve.eventProperties = properties

  const startTime = Date.now()
  let result = null
  try {
    result = await resolve.executeQuery.updateByEvents(
      listenerId,
      events.map(decodeEvent),
      resolve.getRemainingTimeInMillis
    )
    subSegment.addAnnotation('eventCount', events.length)
    subSegment.addAnnotation('origin', 'resolve:applyEventsFromBus')
  } catch (error) {
    log.error('Error while applying events to read-model', error)
    subSegment.addError(error)
    result = error
  } finally {
    subSegment.close()
  }
  const endTime = Date.now()
  log.debug('applying events successfully')
  log.verbose(`event count = ${events.length}, time = ${endTime - startTime}ms`)

  return result
}

const handleEventBusEvent = async (lambdaEvent, resolve) => {
  switch (lambdaEvent['detail-type']) {
    case 'APPLY_EVENTS_FROM_EVENT_BUS': {
      return await handleApplyEvents(lambdaEvent, resolve)
    }
    default: {
      throw new Error(
        `Unknown event from the event bus { "detail-type": ${JSON.stringify(
          lambdaEvent['detail-type']
        )} }`
      )
    }
  }
}

export default handleEventBusEvent
