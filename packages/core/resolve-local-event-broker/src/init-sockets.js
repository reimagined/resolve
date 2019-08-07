import { INCOMING_TOPICS } from './constants'

const initSockets = async pool => {
  const xpubSocket = pool.zmq.socket('xpub')
  // ZMQ parameters described here http://api.zeromq.org/3-3:zmq-setsockopt
  xpubSocket.setsockopt(pool.zmq.ZMQ_SNDHWM, 1000)
  xpubSocket.setsockopt(pool.zmq.ZMQ_XPUB_VERBOSE, 0)
  xpubSocket.bindSync(pool.config.zmqBrokerAddress)

  xpubSocket.on('message', pool.onXpubMessage.bind(null, pool))

  const subSocket = pool.zmq.socket('sub')
  for (const topicName of Object.values(INCOMING_TOPICS)) {
    subSocket.setsockopt(pool.zmq.ZMQ_SUBSCRIBE, Buffer.from(topicName))
  }

  subSocket.bindSync(pool.config.zmqConsumerAddress)

  subSocket.on('message', pool.onSubMessage.bind(null, pool))

  Object.assign(pool, {
    localEventTypesMap: new Map(),
    waitMessagePromises: new Map(),
    clientMap: new Map(),
    xpubSocket,
    subSocket
  })
}

export default initSockets
