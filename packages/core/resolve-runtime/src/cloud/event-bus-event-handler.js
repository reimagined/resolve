import debugLevels from 'resolve-debug-levels'
import invokeEventBus from './invoke-event-bus'
import { XaTransactionNotFoundError } from 'resolve-readmodel-base'

const log = debugLevels('resolve:resolve-runtime:event-bus-event-handler')

const sendEvents = async (payload, resolve) => {
  const segment = resolve.performanceTracer.getSegment()
  const subSegment = segment.addNewSubsegment('applyEventsFromBus')

  const { xaTransactionId, eventSubscriber, events, batchId } = payload
  if (eventSubscriber === 'websocket' && batchId == null) {
    // TODO: Inject MQTT events directly from cloud event bus lambda
    for (const event of events) {
      const eventDescriptor = {
        topic: `${process.env.RESOLVE_DEPLOYMENT_ID}/${event.type}/${event.aggregateId}`,
        payload: JSON.stringify(event),
        qos: 1
      }

      await resolve.mqtt.publish(eventDescriptor).promise()
    }

    return
  }

  //TODO Properties
  const properties = {
    RESOLVE_SIDE_EFFECTS_START_TIMESTAMP: 0
  }

  log.debug('applying events started')
  log.verbose(JSON.stringify({ eventSubscriber, properties }, null, 2))

  const startTime = Date.now()
  let result = null
  try {
    const listenerInfo = resolve.eventListeners.get(eventSubscriber)
    if (listenerInfo == null) {
      throw new Error(`Listener ${eventSubscriber} does not exist`)
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

  if (result != null && result.error instanceof XaTransactionNotFoundError) {
    log.debug('XaTransaction is auto rollback')

    return
  }

  if (result != null && result.constructor === Error) {
    result = {
      error: {
        code: String(result.code),
        message: String(result.message),
        stack: String(result.stack)
      },
      successEvent: null,
      failedEvent: null
    }
  } else if (result == null || result.constructor !== Object) {
    result = {
      error: {
        message: `Result is unknown entity ${JSON.stringify(result)}`
      },
      successEvent: null,
      failedEvent: null
    }
  } else if (result.error != null && result.error.constructor === Error) {
    result.error = {
      code: String(result.error.code),
      message: String(result.error.message),
      stack: String(result.error.stack)
    }
  }

  const endTime = Date.now()
  log.debug('applying events successfully')
  log.verbose(`event count = ${events.length}, time = ${endTime - startTime}ms`)

  await invokeEventBus(resolve.eventstoreCredentials, 'acknowledge', {
    batchId,
    result
  })
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
  const { eventSubscriber, batchId, xaTransactionId, countEvents } = payload
  const listenerInfo = resolve.eventListeners.get(eventSubscriber)
  if (listenerInfo == null) {
    throw new Error(`Listener ${eventSubscriber} does not exist`)
  }
  const commitXATransaction = listenerInfo.isSaga
    ? resolve.executeSaga.commitXATransaction
    : resolve.executeQuery.commitXATransaction
  const maybeEventCount = await commitXATransaction({
    modelName: eventSubscriber,
    batchId,
    xaTransactionId,
    countEvents
  })

  return maybeEventCount
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
