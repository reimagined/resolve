import zmq from 'zeromq'
import initMeta from './meta'

const stopBatchFlag = new Error('Stop batch flag')

const checkOptionShape = (option, types, nullable = false) =>
  (nullable && option === null) ||
  !(
    option == null ||
    !types.reduce((acc, type) => acc || option.constructor === type, false)
  )

const parseMessage = message => {
  if (!(message instanceof Buffer)) {
    throw new Error('Message should be instance of Buffer')
  }
  const topic = message.toString('utf8', 1)
  const isConnection = message[0] === 1

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
    events.push({ type: 'Init' })
  }

  try {
    await pool.eventStore.loadEvents(
      { skipBus: true, startTime: AbutTimestamp },
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

        if (events.length >= pool.config.batchSize) {
          throw stopBatchFlag
        }
      }
    )
  } catch (error) {
    if (error !== stopBatchFlag) {
      // eslint-disable-next-line no-console
      console.warn('Error while loading events for listener', error)
      return
    }
  }

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

const onSubMessage = (pool, message) => {
  // TODO: maybe broadcase message ifself in future
  void message

  for (const listenerId of pool.followTopicPromises.keys()) {
    pool.followTopicPromises.set(
      listenerId,
      pool.followTopicPromises
        .get(listenerId)
        .then(followTopic.bind(null, pool, listenerId))
    )
  }
}

const onXpubMessage = (pool, message) => {
  try {
    const { listenerId, clientId, isConnection } = parseMessage(message)
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
  subSocket.bindSync(pool.config.zmqConsumerAddress)

  subSocket.on('message', onSubMessage.bind(null, pool))

  Object.assign(pool, {
    followTopicPromises: new Map(),
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

const rewindListener = async ({ meta }, listenerId) => {
  await meta.rewindListener(listenerId)
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
