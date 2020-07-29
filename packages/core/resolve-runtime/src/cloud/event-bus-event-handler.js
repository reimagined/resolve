import debugLevels from 'resolve-debug-levels'
import invokeEventBus from './invoke-event-bus'
import { OMIT_BATCH } from 'resolve-readmodel-base'

const log = debugLevels('resolve:resolve-runtime:event-bus-event-handler')

const serializeError = error => ({
  name: error.name != null ? String(error.name) : error.name,
  code: String(error.code),
  message: String(error.message),
  stack: String(error.stack)
})

const sendCursor = async (payload, resolve) => {
  const segment = resolve.performanceTracer.getSegment()
  const subSegment = segment.addNewSubsegment('applyEventsFromBus')

  const {
    xaTransactionId,
    eventSubscriber,
    deliveryStrategy,
    eventTypes,
    aggregateIds,
    cursor,
    batchId,
    properties
  } = payload

  const eventsCountLimit =
    deliveryStrategy === 'active-xa-transaction' ? 10 * 1000 * 1000 : 10

  const { events: incomingEvents } = await resolve.eventstoreAdapter.loadEvents(
    {
      eventTypes,
      limit: eventsCountLimit,
      eventsSizeLimit: 1024 * 1024 * 1024,
      aggregateIds,
      cursor
    }
  )

  if (eventSubscriber === 'websocket' && batchId == null) {
    // TODO: Inject MQTT events directly from cloud event bus lambda
    for (const event of incomingEvents) {
      const eventDescriptor = {
        topic: `${process.env.RESOLVE_DEPLOYMENT_ID}/${event.type}/${event.aggregateId}`,
        payload: JSON.stringify(event),
        qos: 1
      }

      await resolve.mqtt.publish(eventDescriptor).promise()
    }

    return
  }

  const startTime = Date.now()
  let result = null

  try {
    let pureEventSubscriber, parallelGroupName
    try {
      void ({ pureEventSubscriber, parallelGroupName = 'default' } = JSON.parse(
        eventSubscriber
      ))
      if (
        pureEventSubscriber == null ||
        (pureEventSubscriber.constructor !== String &&
          parallelGroupName == null) ||
        parallelGroupName.constructor !== String
      ) {
        // eslint-disable-next-line no-throw-literal
        throw null
      }
    } catch (error) {
      throw new Error(`Incorrect event subscriber ${eventSubscriber}`)
    }

    log.debug('applying events started')
    log.verbose(JSON.stringify({ eventSubscriber, properties }, null, 2))

    const listenerInfo = resolve.eventListeners.get(pureEventSubscriber)
    if (listenerInfo == null) {
      throw new Error(`Listener ${pureEventSubscriber} does not exist`)
    }

    let events = incomingEvents
    if (typeof listenerInfo.classifier === 'function') {
      events = []
      for (const event of incomingEvents) {
        if ((await listenerInfo.classifier(event)) === parallelGroupName) {
          events.push(event)
        }
      }
      incomingEvents.length = 0
    }

    const updateByEvents = listenerInfo.isSaga
      ? resolve.executeSaga.updateByEvents
      : resolve.executeQuery.updateByEvents

    result = await updateByEvents({
      modelName: eventSubscriber,
      events,
      getRemainingTimeInMillis: resolve.getRemainingTimeInMillis,
      properties,
      xaTransactionId
    })

    subSegment.addAnnotation('eventCount', events.length)
    subSegment.addAnnotation('origin', 'resolve:applyEventsFromBus')
  } catch (error) {
    log.error('Error while applying events to read-model', error)
    subSegment.addError(error)
    result = error
  } finally {
    subSegment.close()
  }

  if (result != null && result.error === OMIT_BATCH) {
    log.debug('XaTransaction is auto rollback')

    return
  }

  if (
    (result != null && result.constructor === Error) ||
    result == null ||
    result.constructor !== Object
  ) {
    result = {
      error:
        result == null || result.constructor !== Object
          ? serializeError(
              new Error(`Result is unknown entity ${JSON.stringify(result)}`)
            )
          : serializeError(result),
      appliedEventsList: [],
      successEvent: null,
      failedEvent: null
    }
  } else if (result.error.constructor === Error) {
    result.error = serializeError(result.error)
  }

  const endTime = Date.now()
  log.debug('applying events successfully')
  log.verbose(
    `event count = ${result.appliedEventsList.length}, time = ${endTime -
      startTime}ms`
  )

  const nextCursor = await resolve.eventstoreAdapter.getNextCursor(
    cursor,
    result.appliedEventsList
  )

  await invokeEventBus(resolve.eventstoreCredentials, 'acknowledge', {
    batchId,
    result: {
      successEvent: result.successEvent,
      failedEvent: result.failedEvent,
      error: result.error,
      nextCursor
    }
  })
}

const sendEvents = async (payload, resolve) => {
  const { eventSubscriber, batchId, events } = payload

  if (!(eventSubscriber === 'websocket' && batchId == null)) {
    throw new Error(
      `Unknown passthrough subscriber "${eventSubscriber}" via batchId="${batchId}"`
    )
  }

  // TODO: Inject MQTT events directly from cloud event bus lambda
  for (const event of events) {
    const eventDescriptor = {
      topic: `${process.env.RESOLVE_DEPLOYMENT_ID}/${event.type}/${event.aggregateId}`,
      payload: JSON.stringify(event),
      qos: 1
    }

    await resolve.mqtt.publish(eventDescriptor).promise()
  }
}

const beginXATransaction = async (payload, resolve) => {
  const { eventSubscriber, batchId } = payload
  const listenerInfo = resolve.eventListeners.get(eventSubscriber)
  if (listenerInfo == null) {
    throw new Error(`Listener ${eventSubscriber} does not exist`)
  }
  const beginXATransaction = listenerInfo.isSaga
    ? resolve.executeSaga.beginXATransaction
    : resolve.executeQuery.beginXATransaction

  const xaTransactionId = await beginXATransaction({
    modelName: eventSubscriber,
    batchId
  })

  return xaTransactionId
}

const commitXATransaction = async (payload, resolve) => {
  const { eventSubscriber, batchId, xaTransactionId, cursor, dryRun } = payload
  const listenerInfo = resolve.eventListeners.get(eventSubscriber)
  if (listenerInfo == null) {
    throw new Error(`Listener ${eventSubscriber} does not exist`)
  }
  const commitXATransaction = listenerInfo.isSaga
    ? resolve.executeSaga.commitXATransaction
    : resolve.executeQuery.commitXATransaction

  const result = await commitXATransaction({
    modelName: eventSubscriber,
    batchId,
    xaTransactionId,
    dryRun
  })

  if (dryRun) {
    const nextCursor = await resolve.eventstoreAdapter.getNextCursor(
      cursor,
      result
    )
    return nextCursor
  } else {
    return result
  }
}

const rollbackXATransaction = async (payload, resolve) => {
  const { eventSubscriber, batchId, xaTransactionId } = payload
  const listenerInfo = resolve.eventListeners.get(eventSubscriber)
  if (listenerInfo == null) {
    throw new Error(`Listener ${eventSubscriber} does not exist`)
  }
  const rollbackXATransaction = listenerInfo.isSaga
    ? resolve.executeSaga.rollbackXATransaction
    : resolve.executeQuery.rollbackXATransaction

  await rollbackXATransaction({
    modelName: eventSubscriber,
    batchId,
    xaTransactionId
  })
}

const drop = async (payload, resolve) => {
  const { eventSubscriber } = payload
  const listenerInfo = resolve.eventListeners.get(eventSubscriber)
  if (listenerInfo == null) {
    throw new Error(`Listener ${eventSubscriber} does not exist`)
  }

  const drop = listenerInfo.isSaga
    ? resolve.executeSaga.drop
    : resolve.executeQuery.drop

  await drop(eventSubscriber)
}

const handleEventBusEvent = async (lambdaEvent, resolve) => {
  switch (lambdaEvent['method']) {
    case 'SendCursor': {
      return await sendCursor(lambdaEvent.payload, resolve)
    }
    case 'SendEvents': {
      return await sendEvents(lambdaEvent.payload, resolve)
    }
    case 'BeginXATransaction': {
      return await beginXATransaction(lambdaEvent.payload, resolve)
    }
    case 'CommitXATransaction': {
      return await commitXATransaction(lambdaEvent.payload, resolve)
    }
    case 'RollbackXATransaction': {
      return await rollbackXATransaction(lambdaEvent.payload, resolve)
    }
    case 'Drop': {
      return await drop(lambdaEvent.payload, resolve)
    }
    default: {
      throw new Error(
        `Unknown event from the event bus { "method": ${JSON.stringify(
          lambdaEvent['method']
        )} }`
      )
    }
  }
}

export default handleEventBusEvent
