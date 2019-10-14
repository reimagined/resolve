import debugLevels from 'resolve-debug-levels'

import initResolve from '../common/init-resolve'
import disposeResolve from '../common/dispose-resolve'

const log = debugLevels('resolve:resolve-runtime:local:init-broker')

const initBroker = async resolve => {
  const {
    assemblies: { connectLocalBusBroker, eventBroker: eventBrokerConfig }
  } = resolve

  const updateByEvents = async (listenerId, events, properties) => {
    const currentResolve = Object.create(resolve)
    let result = null

    try {
      await initResolve(currentResolve)
      const listenerInfo = currentResolve.eventListeners.get(listenerId)
      if (listenerInfo == null) {
        throw new Error(`Listener ${listenerId} does not exist`)
      }

      const updateByEvents = listenerInfo.isSaga
        ? currentResolve.executeSaga.updateByEvents
        : currentResolve.executeQuery.updateByEvents

      result = await updateByEvents(
        listenerId,
        events,
        currentResolve.getRemainingTimeInMillis,
        properties
      )

      if (result.lastError != null) {
        log.error('Error while applying events to read-model', result.lastError)
      }
    } catch (error) {
      log.error('Error while applying events to read-model', error)

      result = error
    }

    try {
      await disposeResolve(currentResolve)
    } catch (error) {
      log.error('Error while applying events to read-model', error)

      result = error
    }

    return result
  }

  const broker = await connectLocalBusBroker({
    eventBrokerConfig,
    instanceId: resolve.instanceId,
    updateByEvents
  })

  const publishEvent = async event => {
    await broker.publishEvent(event)

    await resolve.pubsubManager.dispatch({
      topicName: event.type,
      topicId: event.aggregateId,
      event
    })
  }

  const wrapListenerMethod = method => async listenerId => {
    const listenerInfo = resolve.eventListeners.get(listenerId)
    if (listenerInfo == null) {
      throw new Error(`Listener ${listenerId} does not exist`)
    }

    const eventTypes = listenerInfo.eventTypes
    const result = await method(listenerId, eventTypes)
    return result
  }

  Object.assign(resolve.eventBroker, {
    reset: wrapListenerMethod(broker.reset.bind(broker)),
    status: wrapListenerMethod(broker.status.bind(broker)),
    pause: wrapListenerMethod(broker.pause.bind(broker)),
    resume: wrapListenerMethod(broker.resume.bind(broker)),
    listProperties: broker.listProperties.bind(broker),
    getProperty: broker.getProperty.bind(broker),
    setProperty: broker.setProperty.bind(broker),
    deleteProperty: broker.deleteProperty.bind(broker)
  })

  Object.assign(resolve, {
    doUpdateRequest: wrapListenerMethod(broker.doUpdateRequest.bind(broker)),
    disposeBroker: broker.dispose.bind(broker),
    publishEvent
  })
}

export default initBroker
