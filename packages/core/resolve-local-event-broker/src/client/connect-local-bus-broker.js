import { SERVER_TO_CLIENT_TOPICS } from '../constants'

const connectLocalBusBroker = async (
  {
    declareListenerEventTypes,
    processIncomingMessages,
    requestListenerReset,
    requestListenerInformation,
    requestListenerPause,
    requestListenerResume,
    invokePropertyAction,
    doUpdateRequest,
    publishEvent,
    processEvents,
    processResetListenerAcknowledge,
    processInformation,
    processProperties,
    decodeXsubContent,
    decodeXsubTopic,
    encodePubContent,
    encodeXsubTopic,
    dispose,
    cuid,
    zmq
  },
  { eventBrokerConfig, updateByEvents, instanceId }
) => {
  const pool = {
    eventBrokerConfig,
    updateByEvents,
    instanceId,
    decodeXsubContent,
    decodeXsubTopic,
    encodePubContent,
    encodeXsubTopic,
    cuid,
    zmq
  }
  // eslint-disable-next-line no-new-func
  const emptyUpstreamFunc = Function('return Promise.resolve()')

  const { zmqBrokerAddress, zmqConsumerAddress, upstream } = eventBrokerConfig
  const subSocket = zmq.socket('sub')
  await subSocket.connect(zmqBrokerAddress)

  const pubSocket = zmq.socket('pub')
  await pubSocket.connect(zmqConsumerAddress)

  await subSocket.on('message', processIncomingMessages.bind(null, pool))

  for (const incomingTopicName of Object.values(SERVER_TO_CLIENT_TOPICS)) {
    await subSocket.subscribe(
      encodeXsubTopic({
        listenerId: incomingTopicName,
        clientId: pool.instanceId
      })
    )
  }

  const broker = {
    reset: requestListenerReset.bind(null, pool),
    status: requestListenerInformation.bind(null, pool),
    pause: upstream ? requestListenerPause.bind(null, pool) : emptyUpstreamFunc,
    resume: upstream
      ? requestListenerResume.bind(null, pool)
      : emptyUpstreamFunc,
    listProperties: invokePropertyAction.bind(null, pool, 'listProperties'),
    getProperty: invokePropertyAction.bind(null, pool, 'getProperty'),
    setProperty: upstream
      ? invokePropertyAction.bind(null, pool, 'setProperty')
      : emptyUpstreamFunc,
    deleteProperty: upstream
      ? invokePropertyAction.bind(null, pool, 'deleteProperty')
      : emptyUpstreamFunc,
    doUpdateRequest: upstream
      ? doUpdateRequest.bind(null, pool)
      : emptyUpstreamFunc,
    publishEvent: upstream ? publishEvent.bind(null, pool) : emptyUpstreamFunc,
    dispose: dispose.bind(null, pool)
  }

  Object.assign(pool, {
    declareListenerEventTypes: declareListenerEventTypes.bind(null, pool),
    processEvents: upstream
      ? processEvents.bind(null, pool)
      : emptyUpstreamFunc,
    processResetListenerAcknowledge: processResetListenerAcknowledge.bind(
      null,
      pool
    ),
    processInformation: processInformation.bind(null, pool),
    processProperties: processProperties.bind(null, pool),
    processEventsPromises: new Map(),
    resetListenersPromises: new Map(),
    informationTopicsPromises: new Map(),
    propertiesTopicsPromises: new Map(),
    subSocket,
    pubSocket,
    ...broker
  })

  return broker
}

export default connectLocalBusBroker
