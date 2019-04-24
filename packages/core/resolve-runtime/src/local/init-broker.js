import zmq from 'zeromq'
import initResolve from '../common/init-resolve'
import disposeResolve from '../common/dispose-resolve'

const RESOLVE_INFORMATION_TOPIC = '__RESOLVE_INFORMATION_TOPIC__'
const RESOLVE_RESET_LISTENER_ACKNOWLEDGE_TOPIC =
  '__RESOLVE_RESET_LISTENER_ACKNOWLEDGE_TOPIC__'

const isPromise = promise => Promise.resolve(promise) === promise

const processEvents = async (resolve, listenerId, messageGuid, content) => {
  let unlock = null
  const currentResolve = Object.create(resolve)
  try {
    if (!resolve.lockPromises.has(listenerId)) {
      resolve.lockPromises.set(listenerId, null)
    }

    while (isPromise(resolve.lockPromises.get(listenerId))) {
      await resolve.lockPromises.get(listenerId)
    }
    resolve.lockPromises.set(
      listenerId,
      new Promise(resolve => (unlock = resolve))
    )

    await initResolve(currentResolve)

    const events = JSON.parse(content)
    const result = await currentResolve.executeQuery.updateByEvents(
      listenerId,
      events
    )

    resolve.pubSocket.send(
      `ACKNOWLEDGE-BATCH-TOPIC ${messageGuid} ${new Buffer(
        JSON.stringify(result)
      ).toString('base64')}`
    )

    resolve.listenersInitPromises.get(listenerId).resolvePromise()
  } catch (result) {
    resolveLog('error', 'Error while applying events to read-model', result)

    resolve.pubSocket.send(
      `ACKNOWLEDGE-BATCH-TOPIC ${messageGuid} ${new Buffer(
        JSON.stringify(result)
      ).toString('base64')}`
    )
  } finally {
    resolve.lockPromises.set(listenerId, null)
    unlock()
    await disposeResolve(currentResolve)
  }
}

const processInformation = async (resolve, messageGuid, content) => {
  await resolve.informationTopicsPromises.get(messageGuid)(JSON.parse(content))
}

const processResetListenerAcknowledge = async (
  resolve,
  messageGuid,
  content
) => {
  await resolve.resetListenersPromises.get(messageGuid)(JSON.parse(content))
}

const processIncomingMessages = async (resolve, byteMessage) => {
  const message = byteMessage.toString('utf8')
  const messageGuidIndex = message.indexOf(' ') + 1
  const payloadIndex = message.indexOf(' ', messageGuidIndex) + 1
  const messageGuid = message.substring(messageGuidIndex, payloadIndex - 1)
  const content = message.substr(payloadIndex)

  const [topicName, instanceId] = message
    .substring(0, messageGuidIndex - 1)
    .split('-')
    .map(str => new Buffer(str, 'base64').toString('utf8'))

  if (instanceId !== resolve.instanceId) {
    throw new Error(
      `Instance ${
        resolve.instanceId
      } has received message addressed to ${instanceId}`
    )
  }

  switch (topicName) {
    case RESOLVE_RESET_LISTENER_ACKNOWLEDGE_TOPIC:
      return await processResetListenerAcknowledge(
        resolve,
        messageGuid,
        content
      )
    case RESOLVE_INFORMATION_TOPIC:
      return await processInformation(resolve, messageGuid, content)
    default:
      return await processEvents(resolve, topicName, messageGuid, content)
  }
}

const requestListenerInformation = async (resolve, listenerId) => {
  const requestGuid = `${Date.now()}${Math.floor(Math.random() * 100000000000)}`
  const promise = new Promise(resolvePromise => {
    resolve.informationTopicsPromises.set(requestGuid, resolvePromise)
  })

  resolve.pubSocket.send(
    `INFORMATION-TOPIC ${requestGuid} ${new Buffer(listenerId).toString(
      'base64'
    )}-${new Buffer(resolve.instanceId).toString('base64')}`
  )

  return await promise
}

const requestListenerReset = async (resolve, listenerId) => {
  const requestGuid = `${Date.now()}${Math.floor(Math.random() * 100000000000)}`
  const promise = new Promise(resolvePromise => {
    resolve.resetListenersPromises.set(requestGuid, resolvePromise)
  })

  await resolve.pubSocket.send(
    `RESET-LISTENER-TOPIC ${requestGuid} ${new Buffer(listenerId).toString(
      'base64'
    )}-${new Buffer(resolve.instanceId).toString('base64')}`
  )

  return await promise
}

const requestListenerPause = async (resolve, listenerId) => {
  await resolve.pubSocket.send(`PAUSE-LISTENER-TOPIC ${listenerId}`)
}

const requestListenerResume = async (resolve, listenerId) => {
  await resolve.pubSocket.send(`RESUME-LISTENER-TOPIC ${listenerId}`)
}

const initBroker = async resolve => {
  const {
    assemblies: { eventBroker: eventBrokerConfig },
    readModels: listeners
  } = resolve

  const { zmqBrokerAddress, zmqConsumerAddress } = eventBrokerConfig
  const subSocket = zmq.socket('sub')
  await subSocket.connect(zmqBrokerAddress)

  const pubSocket = zmq.socket('pub')
  await pubSocket.connect(zmqConsumerAddress)

  subSocket.on('message', processIncomingMessages.bind(null, resolve))

  const doUpdateRequest = listenerId => {
    const topic = `${new Buffer(listenerId).toString('base64')}-${new Buffer(
      resolve.instanceId
    ).toString('base64')}`

    return resolve.subSocket.subscribe(topic)
  }

  const publishEvent = async event => {
    await resolve.pubSocket.send(`EVENT-TOPIC ${JSON.stringify(event)}`)

    await resolve.pubsubManager.dispatch({
      topicName: event.type,
      topicId: event.aggregateId,
      event
    })
  }

  const informationTopic = `${new Buffer(RESOLVE_INFORMATION_TOPIC).toString(
    'base64'
  )}-${new Buffer(resolve.instanceId).toString('base64')}`

  subSocket.subscribe(informationTopic)

  const resetAcknowledgeTopic = `${new Buffer(
    RESOLVE_RESET_LISTENER_ACKNOWLEDGE_TOPIC
  ).toString('base64')}-${new Buffer(resolve.instanceId).toString('base64')}`

  subSocket.subscribe(resetAcknowledgeTopic)

  Object.defineProperties(resolve, {
    lockPromises: {
      value: new Map()
    },
    resetListenersPromises: {
      value: new Map()
    },
    listenersInitPromises: {
      value: new Map()
    },
    informationTopicsPromises: {
      value: new Map()
    },
    subSocket: {
      value: subSocket
    },
    pubSocket: {
      value: pubSocket
    },
    doUpdateRequest: {
      value: doUpdateRequest
    },
    publishEvent: {
      value: publishEvent
    }
  })

  for (const { name } of listeners) {
    let resolvePromise = null
    const promise = new Promise(resolve => (resolvePromise = resolve))
    promise.resolvePromise = resolvePromise
    resolve.listenersInitPromises.set(name, promise)
  }

  Object.assign(resolve.eventBroker, {
    reset: requestListenerReset.bind(null, resolve),
    status: requestListenerInformation.bind(null, resolve),
    pause: requestListenerPause.bind(null, resolve),
    resume: requestListenerResume.bind(null, resolve)
  })
}

export default initBroker
