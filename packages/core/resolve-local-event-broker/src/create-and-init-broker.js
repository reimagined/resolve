import { INCOMING_TOPICS } from './constants'

const createAndInitBroker = async (imports, config) => {
  const pool = { ...imports, config, eventStore: config.eventStore }

  if (
    !pool.checkOptionShape(pool.config, [Object]) ||
    !pool.checkOptionShape(pool.config.zmqBrokerAddress, [String]) ||
    !pool.checkOptionShape(pool.config.zmqConsumerAddress, [String]) ||
    !pool.checkOptionShape(pool.config.databaseFile, [String]) ||
    !pool.checkOptionShape(pool.config.batchSize, [Number]) ||
    !pool.checkOptionShape(pool.config.eventStore, [Object])
  ) {
    throw new Error(`
      Local event broker configuration is malformed.
      Config should be following be following object shape: {
        zmqBrokerAddress: "broker-ip-address:port",
        zmqConsumerAddress: "consumer-ip-address:port",
        databaseFile: "path/to/database",
        eventStore: <reSolve eventstore>
      }
    `)
  }

  const xpubSocket = pool.zmq.socket('xpub')
  // ZMQ parameters described here http://api.zeromq.org/3-3:zmq-setsockopt
  xpubSocket.setsockopt(pool.zmq.ZMQ_SNDHWM, 1000)
  xpubSocket.setsockopt(pool.zmq.ZMQ_XPUB_VERBOSE, 0)
  xpubSocket.bindSync(pool.config.zmqBrokerAddress)

  xpubSocket.on('message', pool.onXpubMessage.bind(null, pool))

  const subSocket = pool.zmq.socket('sub')
  for (const topicName of Object.values(INCOMING_TOPICS)) {
    subSocket.setsockopt(pool.zmq.ZMQ_SUBSCRIBE, new Buffer(topicName))
  }

  subSocket.bindSync(pool.config.zmqConsumerAddress)

  subSocket.on('message', pool.onSubMessage.bind(null, pool))

  Object.assign(pool, {
    waitMessagePromises: new Map(),
    clientMap: new Map(),
    xpubSocket,
    subSocket
  })

  await pool.initMeta(pool)

  return pool.dispose.bind(null, pool)
}

export default createAndInitBroker
