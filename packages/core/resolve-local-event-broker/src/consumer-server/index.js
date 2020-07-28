import { createServer } from 'resolve-local-rpc'
import { OMIT_BATCH } from 'resolve-readmodel-base'

const serializeError = error => ({
  name: error.name != null ? String(error.name)  : error.name,
  code: String(error.code),
  message: String(error.message),
  stack: String(error.stack)
})

const createAndInitConsumer = async config => {
  const {
    baseResolve,
    initResolve,
    disposeResolve,
    publisher,
    address
  } = config

  const beginXATransaction = async ({ eventSubscriber, batchId }) => {
    const currentResolve = Object.create(baseResolve)
    const listenerInfo = currentResolve.eventListeners.get(eventSubscriber)
    if (listenerInfo == null) {
      throw new Error(`Listener ${eventSubscriber} does not exist`)
    }

    try {
      await initResolve(currentResolve)
      const beginXATransaction = listenerInfo.isSaga
        ? currentResolve.executeSaga.beginXATransaction
        : currentResolve.executeQuery.beginXATransaction

      const xaTransactionId = await beginXATransaction({
        modelName: eventSubscriber,
        batchId
      })

      return xaTransactionId
    } finally {
      await disposeResolve(currentResolve)
    }
  }

  const commitXATransaction = async ({
    eventSubscriber,
    batchId,
    xaTransactionId,
    cursor,
    dryRun
  }) => {
    const currentResolve = Object.create(baseResolve)
    const listenerInfo = currentResolve.eventListeners.get(eventSubscriber)
    if (listenerInfo == null) {
      throw new Error(`Listener ${eventSubscriber} does not exist`)
    }

    try {
      await initResolve(currentResolve)
      const commitXATransaction = listenerInfo.isSaga
        ? currentResolve.executeSaga.commitXATransaction
        : currentResolve.executeQuery.commitXATransaction

      const result = await commitXATransaction({
        modelName: eventSubscriber,
        batchId,
        xaTransactionId,
        dryRun
      })

      if(dryRun) {
        const nextCursor = await resolve.eventstoreAdapter.getNextCursor(cursor, result)
        return nextCursor
      } else {
        return result
      }
    } finally {
      await disposeResolve(currentResolve)
    }
  }

  const rollbackXATransaction = async ({
    eventSubscriber,
    batchId,
    xaTransactionId
  }) => {
    const currentResolve = Object.create(baseResolve)
    const listenerInfo = currentResolve.eventListeners.get(eventSubscriber)
    if (listenerInfo == null) {
      throw new Error(`Listener ${eventSubscriber} does not exist`)
    }

    try {
      await initResolve(currentResolve)
      const rollbackXATransaction = listenerInfo.isSaga
        ? currentResolve.executeSaga.rollbackXATransaction
        : currentResolve.executeQuery.rollbackXATransaction

      await rollbackXATransaction({
        modelName: eventSubscriber,
        batchId,
        xaTransactionId
      })
    } finally {
      await disposeResolve(currentResolve)
    }
  }

  const drop = async ({ eventSubscriber }) => {
    const currentResolve = Object.create(baseResolve)
    const listenerInfo = currentResolve.eventListeners.get(eventSubscriber)
    if (listenerInfo == null) {
      throw new Error(`Listener ${eventSubscriber} does not exist`)
    }

    try {
      await initResolve(currentResolve)
      const drop = listenerInfo.isSaga
        ? currentResolve.executeSaga.drop
        : currentResolve.executeQuery.drop

      await drop(eventSubscriber)
    } finally {
      await disposeResolve(currentResolve)
    }
  }

  const sendEvents = async ({
    eventSubscriber,
    batchId,
    xaTransactionId,
    deliveryStrategy,
    eventTypes,
    aggregateIds,
    cursor,
    properties
  }) => {
    const currentResolve = Object.create(baseResolve)
    let result = null
    try {
      await initResolve(currentResolve)

      const eventsCountLimit = deliveryStrategy === 'active-xa-transaction' ? 10 * 1000 * 1000 : 10

      const { events: incomingEvents } = await currentResolve.eventstoreAdapter.loadEvents({
        eventTypes,
        limit: eventsCountLimit,
        eventsSizeLimit: 1024 * 1024 * 1024,
        aggregateIds,
        cursor
      })

      // TODO segragate passthough subscribers
      if (batchId == null && eventSubscriber === 'websocket') {
        for (const event of incomingEvents) {
          await currentResolve.pubsubManager.dispatch({
            topicName: event.type,
            topicId: event.aggregateId,
            event
          })
        }

        return
      }

      try {
        let pureEventSubscriber, parallelGroupName
        try {
          void ({ pureEventSubscriber, parallelGroupName = 'default' } = JSON.parse(eventSubscriber))
          if(pureEventSubscriber == null || pureEventSubscriber.constructor !== String &&
            parallelGroupName == null || parallelGroupName.constructor !== String) {
              throw null
          }
        } catch(error) {
          throw new Error(`Incorrect event subscriber ${eventSubscriber}`)
        }

        const listenerInfo = currentResolve.eventListeners.get(pureEventSubscriber)
        if (listenerInfo == null) {
          throw new Error(`Listener ${pureEventSubscriber} does not exist`)
        }

        const events = []
        for(const event of incomingEvents) {
          if(await listenerInfo.classifier(event) === parallelGroupName) {
            events.push(event)
          }
        }
        incomingEvents.length = 0

        const updateByEvents = listenerInfo.isSaga
          ? currentResolve.executeSaga.updateByEvents
          : currentResolve.executeQuery.updateByEvents

        result = await updateByEvents({
          modelName: eventSubscriber,
          getRemainingTimeInMillis: currentResolve.getRemainingTimeInMillis,
          events,
          properties,
          xaTransactionId
        })
      } catch (error) {
        result = error
      }

      if (result != null && result.error === OMIT_BATCH) {
        return
      }

      if ((result != null && result.constructor === Error) || (result == null || result.constructor !== Object)) {
        result = {
          error: result == null || result.constructor !== Object
            ? serializeError(new Error(`Result is unknown entity ${JSON.stringify(result)}`))
            : serializeError(result),
          appliedEventsList: [],
          successEvent: null,
          failedEvent: null
        }
      } else if (result.error.constructor === Error) {
        result.error = serializeError(result.error)
      }

      const nextCursor = await resolve.eventstoreAdapter.getNextCursor(cursor, result.appliedEventsList)

      await publisher.acknowledge({
        batchId,
        result: {
          successEvent: result.successEvent,
          failedEvent: result.failedEvent,
          error: result.error,
          nextCursor
        }
      })
    } finally {
      await disposeResolve(currentResolve)
    }
  }

  const loadEvents = async ({ ...eventFilter }) => {
    const currentResolve = Object.create(baseResolve)
    try {
      await initResolve(currentResolve)
      return await currentResolve.eventstoreAdapter.loadEvents(eventFilter)
    } finally {
      await disposeResolve(currentResolve)
    }
  }

  const saveEvent = async ({ event }) => {
    const currentResolve = Object.create(baseResolve)
    try {
      await initResolve(currentResolve)
      return await currentResolve.eventstoreAdapter.saveEvent(event)
    } finally {
      await disposeResolve(currentResolve)
    }
  }

  const consumer = {
    beginXATransaction,
    commitXATransaction,
    rollbackXATransaction,
    drop,
    sendEvents,
    loadEvents,
    saveEvent
  }

  return await createServer({
    hostObject: consumer,
    address
  })
}

export default createAndInitConsumer
