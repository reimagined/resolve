import zmq from 'zeromq'
import initMeta from './meta'

const checkOptionShape = (option, types, nullable = false) =>
  (nullable && option === null) ||
  !(
    option == null ||
    !types.reduce((acc, type) => acc || option.constructor === type, false)
  )

const RESERVED_SYSTEM_TOPICS = ['ACKNOWLEDGE-TOPIC']

const parseMessage = message => {
  if (!(message instanceof Buffer)) {
    throw new Error('Message should be instance of Buffer')
  }
  const topic = message.toString('utf8', 1)
  const isConnection = message[0] === 1

  if (RESERVED_SYSTEM_TOPICS.includes(topic)) {
    return null
  }

  const [listenerId, clientId] = topic
    .split('-')
    .map(str => new Buffer(str, 'base64').toString('utf8'))

  return { listenerId, clientId, isConnection }
}

const anycastEvents = async (pool, listenerId, events) => {
  const clientId = pool.clientMap
    .get(listenerId)
    [Symbol.iterator]() // eslint-disable-line no-unexpected-multiline
    .next().value

  const topic = `${new Buffer(listenerId).toString('base64')}-${new Buffer(
    clientId
  ).toString('base64')}`

  await pool.xpubSocket.send(`${topic} ${JSON.stringify(events)}`)
}

const followTopic = async (pool, listenerId) => {
  const { meta } = pool

  const listenerInfo = await meta.getListenerInfo(listenerId)
  let AbutTimestamp, SkipCount
  let currentSkipCount = 0
  const events = []

  if (listenerInfo != null) {
    AbutTimestamp = Number(listenerInfo.AbutTimestamp)
    SkipCount = Number(listenerInfo.SkipCount)
  } else {
    AbutTimestamp = SkipCount = 0
    await anycastEvents(pool, listenerId, [{ type: 'Init' }])
  }

  await pool.eventStore.loadEvents(
    { startTime: AbutTimestamp, maxEvents: pool.config.batchSize },
    async event => {
      if (event.timestamp === AbutTimestamp && currentSkipCount < SkipCount) {
        currentSkipCount++
        return
      }
      SkipCount = 0
      if (event.timestamp === AbutTimestamp) {
        currentSkipCount++
      } else {
        AbutTimestamp = event.timestamp
        currentSkipCount = 0
      }

      events.push(event)
    }
  )

  SkipCount = currentSkipCount

  if (events.length === 0) {
    return
  }

  try {
    await anycastEvents(pool, listenerId, events)

    await meta.updateListenerInfo(listenerId, {
      SkipCount,
      AbutTimestamp
    })
  } catch (error) {
    // eslint-disable-next-line no-console
    console.warn('Error while transmitting events for listener', error)
  }

  if (pool.followTopicPromises.has(listenerId)) {
    await followTopic(pool, listenerId)
  }
}

const rewindListener = async ({ meta }, listenerId) => {
  try {
    await meta.rewindListener(listenerId)
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Rewind listener', error)
  }
}

const onSubMessage = (pool, message) => {
  const payloadIndex = message.indexOf(' ') + 1
  const topicName = message.toString('utf8', 0, payloadIndex - 1)
  const content = message.toString('utf8', payloadIndex)

  switch (topicName) {
    case 'EVENT-TOPIC': {
      for (const listenerId of pool.followTopicPromises.keys()) {
        pool.followTopicPromises.set(
          listenerId,
          pool.followTopicPromises
            .get(listenerId)
            .then(followTopic.bind(null, pool, listenerId))
        )
      }
      break
    }
    case 'DROP-MODEL-TOPIC': {
      pool.dropPromise = pool.dropPromise
        .then(rewindListener.bind(null, pool, content))
        .then(
          pool.xpubSocket.send.bind(
            pool.xpubSocket,
            `ACKNOWLEDGE-TOPIC ${message}`
          )
        )
      break
    }
    default:
  }
}

const onXpubMessage = (pool, message) => {
  try {
    const parsedMessage = parseMessage(message)
    if (parsedMessage === null) {
      return
    }

    const { listenerId, clientId, isConnection } = parsedMessage
    if (!pool.clientMap.has(listenerId)) {
      pool.clientMap.set(listenerId, new Set())
      pool.followTopicPromises.set(listenerId, followTopic(pool, listenerId))
    }

    const listenerSet = pool.clientMap.get(listenerId)
    listenerSet[isConnection ? 'add' : 'delete'](clientId)

    if (listenerSet.size === 0) {
      pool.followTopicPromises.delete(listenerId)
      pool.clientMap.delete(listenerId)
    }
  } catch (error) {
    // eslint-disable-next-line no-console
    console.warn(
      'Error while handling subscription/unsubscription message',
      error
    )
  }
}

const init = async pool => {
  if (
    !checkOptionShape(pool.config, [Object]) ||
    !checkOptionShape(pool.config.zmqBrokerAddress, [String]) ||
    !checkOptionShape(pool.config.zmqConsumerAddress, [String]) ||
    !checkOptionShape(pool.config.databaseFile, [String]) ||
    !checkOptionShape(pool.config.batchSize, [Number]) ||
    !checkOptionShape(pool.config.eventStore, [Object])
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

  const xpubSocket = zmq.socket('xpub')
  // ZMQ parameters described here http://api.zeromq.org/3-3:zmq-setsockopt
  xpubSocket.setsockopt(zmq.ZMQ_SNDHWM, 1000)
  xpubSocket.setsockopt(zmq.ZMQ_XPUB_VERBOSE, 0)
  xpubSocket.bindSync(pool.config.zmqBrokerAddress)

  xpubSocket.on('message', onXpubMessage.bind(null, pool))

  const clientMap = new Map()
  const meta = await initMeta(pool.config)

  const subSocket = zmq.socket('sub')
  subSocket.setsockopt(zmq.ZMQ_SUBSCRIBE, new Buffer('EVENT-TOPIC'))
  subSocket.setsockopt(zmq.ZMQ_SUBSCRIBE, new Buffer('DROP-MODEL-TOPIC'))
  subSocket.bindSync(pool.config.zmqConsumerAddress)

  subSocket.on('message', onSubMessage.bind(null, pool))

  Object.assign(pool, {
    followTopicPromises: new Map(),
    dropPromise: Promise.resolve(),
    eventStore: pool.config.eventStore,
    workers: new Map(),
    xpubSocket,
    subSocket,
    clientMap,
    meta
  })
}

const bindWithInit = (pool, func) => async (...args) => {
  if (pool.disposePromise != null) {
    throw new Error('Broker is already disposed')
  }
  if (pool.initialPromise == null) {
    pool.initialPromise = init(pool)
  }
  await pool.initialPromise

  return await func(pool, ...args)
}

const dispose = async (pool, options = {}) => {
  if (checkOptionShape(options, [Object], true)) {
    throw new Error('Wrong options for dispose')
  }

  const { xpubSocket, subSocket, meta, clientMap, eventStore } = pool

  await eventStore.dispose()
  await meta.dispose(!!options.dropInfo)

  xpubSocket.unbindSync(pool.config.zmqBrokerAddress)

  subSocket.unbindSync(pool.config.zmqConsumerAddress)

  clientMap.clear()
}

const createBroker = config => {
  const pool = { config }
  return Object.freeze({
    run: bindWithInit(pool, Promise.resolve.bind(Promise)),
    rewindListener: bindWithInit(pool, rewindListener),
    dispose: bindWithInit(pool, dispose)
  })
}

export default createBroker
