import { createServer } from 'resolve-local-rpc'
import { OMIT_BATCH } from 'resolve-readmodel-base'

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
    countEvents
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

      const maybeEventCount = await commitXATransaction({
        modelName: eventSubscriber,
        batchId,
        xaTransactionId,
        countEvents
      })

      return maybeEventCount
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
    properties,
    events
  }) => {
    const currentResolve = Object.create(baseResolve)
    let result = null
    try {
      await initResolve(currentResolve)

      // TODO segragate passthough subscribers
      if (batchId == null && eventSubscriber === 'websocket') {
        for (const event of events) {
          await currentResolve.pubsubManager.dispatch({ event })
        }
        return
      }

      const listenerInfo = currentResolve.eventListeners.get(eventSubscriber)
      if (listenerInfo == null) {
        throw new Error(`Listener ${eventSubscriber} does not exist`)
      }

      const updateByEvents = listenerInfo.isSaga
        ? currentResolve.executeSaga.updateByEvents
        : currentResolve.executeQuery.updateByEvents

      try {
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

      await publisher.acknowledge({ batchId, result })
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
