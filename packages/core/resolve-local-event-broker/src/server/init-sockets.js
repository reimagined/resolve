import { CLIENT_TO_SERVER_TOPICS } from '../constants'

const initSockets = async pool => {
  const xpubSocket = pool.zmq.socket('xpub')
  // ZMQ parameters described here http://api.zeromq.org/3-3:zmq-setsockopt
  await xpubSocket.setsockopt(pool.zmq.ZMQ_SNDHWM, 1000)
  await xpubSocket.setsockopt(pool.zmq.ZMQ_XPUB_VERBOSE, 0)
  await xpubSocket.bind(pool.config.zmqBrokerAddress)

  await xpubSocket.on('message', pool.onXpubMessage.bind(null, pool))

  const subSocket = pool.zmq.socket('sub')
  for (const topicName of Object.values(CLIENT_TO_SERVER_TOPICS)) {
    await subSocket.setsockopt(pool.zmq.ZMQ_SUBSCRIBE, Buffer.from(topicName))
  }

  await subSocket.bind(pool.config.zmqConsumerAddress)

  await subSocket.on('message', pool.onSubMessage.bind(null, pool))

  Object.assign(pool, {
    localEventTypesMap: new Map(),
    waitMessagePromises: new Map(),
    clientMap: new Map(),
    xpubSocket,
    subSocket
  })
}

export default initSockets
