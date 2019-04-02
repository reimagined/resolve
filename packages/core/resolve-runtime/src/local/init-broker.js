import zmq from 'zeromq'
import initResolve from '../common/init-resolve'
import disposeResolve from '../common/dispose-resolve'

const processIncomingEvents = async (resolve, message) => {
  let unlock = null
  const currentResolve = Object.create(resolve)

  try {
    while (Promise.resolve(resolve.lockPromise) === resolve.lockPromise) {
      await resolve.lockPromise
    }
    resolve.lockPromise = new Promise(resolve => (unlock = resolve))

    await initResolve(currentResolve)

    const payloadIndex = message.indexOf(' ') + 1
    const [readModelName, instanceId] = message
      .toString('utf8', 0, payloadIndex - 1)
      .split('-')
      .map(str => new Buffer(str, 'base64').toString('utf8'))

    if (instanceId === resolve.instanceId) {
      const events = JSON.parse(message.slice(payloadIndex))
      await currentResolve.executeQuery.updateByEvents(readModelName, events)
    }
  } catch (error) {
    resolveLog('error', 'Error while applying events to read-model', error)
  } finally {
    resolve.lockPromise = null
    unlock()
    await disposeResolve(currentResolve)
  }
}

const initBroker = async resolve => {
  const { eventBroker: eventBrokerConfig } = resolve.assemblies

  const { zmqBrokerAddress, zmqConsumerAddress } = eventBrokerConfig

  const subSocket = zmq.socket('sub')
  await subSocket.connect(zmqBrokerAddress)

  const pubSocket = zmq.socket('pub')
  await pubSocket.connect(zmqConsumerAddress)

  subSocket.on('message', processIncomingEvents.bind(null, resolve))

  const doUpdateRequest = readModelName => {
    const topic = `${new Buffer(readModelName).toString('base64')}-${new Buffer(
      resolve.instanceId
    ).toString('base64')}`

    return resolve.subSocket.subscribe(topic)
  }

  const publishEvent = async event => {
    await resolve.pubSocket.send(`EVENT-TOPIC ${JSON.stringify(event)}`)
  }

  Object.defineProperties(resolve, {
    lockPromise: { value: null, writable: true },
    subSocket: { value: subSocket },
    pubSocket: { value: pubSocket },
    doUpdateRequest: { value: doUpdateRequest },
    publishEvent: { value: publishEvent }
  })
}

export default initBroker
