import cuid from 'cuid'
import debugLevels from 'debug-levels'
import zmq from 'zeromq'
import initResolve from '../common/init-resolve'
import disposeResolve from '../common/dispose-resolve'

const log = debugLevels('resolve:resolve-runtime:local-event-broker')

const INCOMING_TOPICS = {
  INFORMATION_TOPIC: '__RESOLVE_INFORMATION_TOPIC__',
  RESET_LISTENER_ACKNOWLEDGE_TOPIC:
    '__RESOLVE_RESET_LISTENER_ACKNOWLEDGE_TOPIC__',
  PROPERTIES_TOPIC: '__RESOLVE_PROPERTIES_TOPIC__'
}

const OUTCOMING_TOPICS = {
  EVENT_TOPIC: 'EVENT-TOPIC',
  RESET_LISTENER_TOPIC: 'RESET-LISTENER-TOPIC',
  PAUSE_LISTENER_TOPIC: 'PAUSE-LISTENER-TOPIC',
  RESUME_LISTENER_TOPIC: 'RESUME-LISTENER-TOPIC',
  ACKNOWLEDGE_BATCH_TOPIC: 'ACKNOWLEDGE-BATCH-TOPIC',
  INFORMATION_TOPIC: 'INFORMATION-TOPIC',
  PROPERTIES_TOPIC: 'PROPERTIES-TOPIC'
}

const isPromise = promise => Promise.resolve(promise) === promise

const encodePubContent = content => new Buffer(content).toString('base64')

const decodeXsubContent = encodedContent => {
  return new Buffer(encodedContent, 'base64').toString('utf8')
}

const encodeXsubTopic = ({ listenerId, clientId }) => {
  const encodedListenerId = new Buffer(listenerId).toString('base64')
  const encodedClientId = new Buffer(clientId).toString('base64')
  const encodedTopic = `${encodedListenerId}-${encodedClientId}`
  return encodedTopic
}

const decodeXsubTopic = encodedTopic => {
  const [encodedListenerId, encodedClientId] = encodedTopic.split('-')
  return {
    listenerId: new Buffer(encodedListenerId, 'base64').toString('utf8'),
    clientId: new Buffer(encodedClientId, 'base64').toString('utf8')
  }
}

const processEvents = async (resolve, listenerId, content) => {
  const { messageGuid, events, properties } = JSON.parse(content)
  const currentResolve = Object.create(resolve)
  let unlock = null
  let result = null

  while (isPromise(resolve.processEventsPromises.get(listenerId))) {
    await resolve.processEventsPromises.get(listenerId)
  }
  resolve.processEventsPromises.set(
    listenerId,
    new Promise(onDone => {
      unlock = () => {
        resolve.processEventsPromises.delete(listenerId)
        onDone()
      }
    })
  )

  try {
    await initResolve(currentResolve)
    currentResolve.eventProperties = properties
    result = await currentResolve.executeQuery.updateByEvents(
      listenerId,
      events
    )
  } catch (error) {
    log.error('Error while applying events to read-model', error)

    result = error
  }

  resolve.initListenersPromises.get(listenerId).resolvePromise()

  const encodedMessage = encodePubContent(
    JSON.stringify({
      messageGuid,
      ...result,
      lastError:
        result.lastError != null
          ? {
              code: Number(result.lastError.code),
              message: String(result.lastError.message),
              stack: String(result.lastError.stack)
            }
          : null
    })
  )

  resolve.pubSocket.send(
    `${OUTCOMING_TOPICS.ACKNOWLEDGE_BATCH_TOPIC} ${encodedMessage}`
  )

  unlock()
  await disposeResolve(currentResolve)
}

const processInformation = async (resolve, content) => {
  const { messageGuid, ...information } = JSON.parse(content)
  const resolver = resolve.informationTopicsPromises.get(messageGuid)
  resolver(information)
}

const processResetListenerAcknowledge = async (resolve, content) => {
  const { messageGuid, ...resetStatus } = JSON.parse(content)
  const resolver = resolve.resetListenersPromises.get(messageGuid)
  resolver(resetStatus)
}

const processProperties = async (resolve, content) => {
  const { messageGuid, result } = JSON.parse(content)
  const resolver = resolve.propertiesTopicsPromises.get(messageGuid)
  resolver(result)
}

const processIncomingMessages = async (resolve, byteMessage) => {
  const message = byteMessage.toString('utf8')
  const payloadIndex = message.indexOf(' ') + 1
  const encodedTopic = message.substring(0, payloadIndex - 1)
  const encodedContent = message.substr(payloadIndex)

  const { listenerId, clientId } = decodeXsubTopic(encodedTopic)
  const content = decodeXsubContent(encodedContent)

  if (clientId !== resolve.instanceId) {
    throw new Error(
      `Instance ${
        resolve.instanceId
      } has received message addressed to ${clientId}`
    )
  }

  switch (listenerId) {
    case INCOMING_TOPICS.RESET_LISTENER_ACKNOWLEDGE_TOPIC:
      return await resolve.processResetListenerAcknowledge(content)
    case INCOMING_TOPICS.INFORMATION_TOPIC:
      return await resolve.processInformation(content)
    case INCOMING_TOPICS.PROPERTIES_TOPIC:
      return await resolve.processProperties(content)
    default:
      return await resolve.processEvents(listenerId, content)
  }
}

const requestListenerInformation = async (resolve, listenerId) => {
  const messageGuid = resolve.cuid()
  const promise = new Promise(resolvePromise => {
    resolve.informationTopicsPromises.set(messageGuid, resolvePromise)
  })

  const encodedMessage = encodePubContent(
    JSON.stringify({
      messageGuid,
      clientId: resolve.instanceId,
      listenerId
    })
  )

  resolve.pubSocket.send(
    `${OUTCOMING_TOPICS.INFORMATION_TOPIC} ${encodedMessage}`
  )

  const result = await promise

  return {
    listenerId,
    status: result.Status,
    lastEvent: result.LastEvent,
    lastError: result.LastError
  }
}

const requestListenerReset = async (resolve, listenerId) => {
  const messageGuid = resolve.cuid()
  const promise = new Promise(resolvePromise => {
    resolve.resetListenersPromises.set(messageGuid, resolvePromise)
  })

  const encodedMessage = encodePubContent(
    JSON.stringify({
      messageGuid,
      clientId: resolve.instanceId,
      listenerId
    })
  )

  await resolve.pubSocket.send(
    `${OUTCOMING_TOPICS.RESET_LISTENER_TOPIC} ${encodedMessage}`
  )

  return await promise
}

const requestListenerPause = async (resolve, listenerId) => {
  const encodedMessage = encodePubContent(JSON.stringify({ listenerId }))
  await resolve.pubSocket.send(
    `${OUTCOMING_TOPICS.PAUSE_LISTENER_TOPIC} ${encodedMessage}`
  )
}

const requestListenerResume = async (resolve, listenerId) => {
  const encodedMessage = encodePubContent(JSON.stringify({ listenerId }))
  await resolve.pubSocket.send(
    `${OUTCOMING_TOPICS.RESUME_LISTENER_TOPIC} ${encodedMessage}`
  )
  await resolve.executeQuery({
    modelName: listenerId,
    resolverName: resolve.bootstrapSymbol,
    resolverArgs: {}
  })
}

const doUpdateRequest = async (resolve, listenerId) => {
  const encodedTopic = encodeXsubTopic({
    clientId: resolve.instanceId,
    listenerId
  })

  return resolve.subSocket.subscribe(encodedTopic)
}

const publishEvent = async (resolve, event) => {
  const encodedMessage = encodePubContent(JSON.stringify({ event }))
  await resolve.pubSocket.send(
    `${OUTCOMING_TOPICS.EVENT_TOPIC} ${encodedMessage}`
  )

  await resolve.pubsubManager.dispatch({
    topicName: event.type,
    topicId: event.aggregateId,
    event
  })
}

const invokePropertyAction = async (
  resolve,
  action,
  listenerId,
  key,
  value
) => {
  const messageGuid = resolve.cuid()
  const promise = new Promise(resolvePromise => {
    resolve.propertiesTopicsPromises.set(messageGuid, resolvePromise)
  })

  const encodedMessage = encodePubContent(
    JSON.stringify({
      messageGuid,
      clientId: resolve.instanceId,
      listenerId,
      action,
      key,
      value
    })
  )

  await resolve.pubSocket.send(
    `${OUTCOMING_TOPICS.PROPERTIES_TOPIC} ${encodedMessage}`
  )

  return await promise
}

const emptyUpstreamFunc = async () => {}

const initBroker = async resolve => {
  const {
    assemblies: { eventBroker: eventBrokerConfig },
    readModels: listeners
  } = resolve

  const { zmqBrokerAddress, zmqConsumerAddress, upstream } = eventBrokerConfig
  const subSocket = zmq.socket('sub')
  await subSocket.connect(zmqBrokerAddress)

  const pubSocket = zmq.socket('pub')
  await pubSocket.connect(zmqConsumerAddress)

  subSocket.on('message', processIncomingMessages.bind(null, resolve))

  for (const incomingTopicName of Object.values(INCOMING_TOPICS)) {
    subSocket.subscribe(
      encodeXsubTopic({
        listenerId: incomingTopicName,
        clientId: resolve.instanceId
      })
    )
  }

  Object.defineProperties(resolve, {
    processEventsPromises: { value: new Map() },
    resetListenersPromises: { value: new Map() },
    initListenersPromises: { value: new Map() },
    informationTopicsPromises: { value: new Map() },
    propertiesTopicsPromises: { value: new Map() },
    subSocket: { value: subSocket },
    pubSocket: { value: pubSocket },
    doUpdateRequest: {
      value: upstream ? doUpdateRequest.bind(null, resolve) : emptyUpstreamFunc
    },
    publishEvent: {
      value: upstream ? publishEvent.bind(null, resolve) : emptyUpstreamFunc
    },
    processResetListenerAcknowledge: {
      value: processResetListenerAcknowledge.bind(null, resolve)
    },
    processInformation: {
      value: processInformation.bind(null, resolve)
    },
    processProperties: {
      value: processProperties.bind(null, resolve)
    },
    processEvents: {
      value: upstream ? processEvents.bind(null, resolve) : emptyUpstreamFunc
    },
    cuid: { value: cuid }
  })

  if (upstream) {
    for (const { name } of listeners) {
      let resolvePromise = null
      const promise = new Promise(resolve => (resolvePromise = resolve))
      promise.resolvePromise = resolvePromise
      resolve.initListenersPromises.set(name, promise)
    }
  }

  Object.assign(resolve.eventBroker, {
    reset: requestListenerReset.bind(null, resolve),
    status: requestListenerInformation.bind(null, resolve),
    pause: upstream
      ? requestListenerPause.bind(null, resolve)
      : emptyUpstreamFunc,
    resume: upstream
      ? requestListenerResume.bind(null, resolve)
      : emptyUpstreamFunc,
    listProperties: invokePropertyAction.bind(null, resolve, 'listProperties'),
    getProperty: invokePropertyAction.bind(null, resolve, 'getProperty'),
    setProperty: upstream
      ? invokePropertyAction.bind(null, resolve, 'setProperty')
      : emptyUpstreamFunc,
    deleteProperty: upstream
      ? invokePropertyAction.bind(null, resolve, 'deleteProperty')
      : emptyUpstreamFunc
  })
}

export default initBroker
