import 'source-map-support/register'
import { Server } from 'http'
import express from 'express'
import MqttConnection from 'mqtt-connection'
import path from 'path'
import wrapApiHandler from 'resolve-api-handler-express'
import createCommandExecutor from 'resolve-command'
import createEventStore from 'resolve-es'
import createQueryExecutor from 'resolve-query'
import createSocketServer from 'socket.io'
import uuid from 'uuid/v4'
import Url from 'url'
import getWebSocketStream from 'websocket-stream'
import { Server as WebSocketServer } from 'ws'
import zmq from 'zeromq'

import createPubsubManager from './utils/create_pubsub_manager'
import getRootBasedUrl from './utils/get_root_based_url'

import mainHandler from './handlers/main_handler'

const host = '0.0.0.0'
const startExpressServer = async ({ port, server }) => {
  await new Promise((resolve, reject) =>
    server.listen(port, host, error => (error ? reject(error) : resolve()))
  )

  server.on('error', err => {
    throw err
  })
}

const initExpress = async resolve => {
  const app = express()
  const server = new Server(app)

  Object.defineProperties(resolve, {
    app: { value: app },
    server: { value: server }
  })
}

const getMqttTopic = (appId, { topicName, topicId }) => {
  return `${appId}/${topicName === '*' ? '+' : topicName}/${
    topicId === '*' ? '+' : topicId
  }`
}

const createServerMqttHandler = (pubsubManager, appId, qos) => ws => {
  const stream = getWebSocketStream(ws)
  const client = new MqttConnection(stream)
  let messageId = 1

  const publisher = (topicName, topicId, event) =>
    new Promise((resolve, reject) => {
      client.publish(
        {
          topic: getMqttTopic(appId, { topicName, topicId }),
          payload: JSON.stringify(event),
          messageId: messageId++,
          qos
        },
        error => (error ? reject(error) : resolve())
      )
    })

  client.on('connect', () => {
    client.connack({ returnCode: 0 })
  })
  client.on('pingreq', () => client.pingresp())

  client.on('subscribe', packet => {
    try {
      for (const subscription of packet.subscriptions) {
        const [, topicName, topicId] = (
          subscription.topic || subscription
        ).split('/')
        pubsubManager.subscribe({ client: publisher, topicName, topicId })
      }
      client.suback({ granted: [packet.qos], messageId: packet.messageId })
    } catch (error) {
      resolveLog('warn', 'MQTT subscription failed', packet, error)
    }
  })

  client.on('unsubscribe', packet => {
    try {
      for (const unsubscription of packet.unsubscriptions) {
        const [, topicName, topicId] = (
          unsubscription.topic || unsubscription
        ).split('/')
        pubsubManager.unsubscribe({ client: publisher, topicName, topicId })
      }
      client.unsuback({ granted: [packet.qos], messageId: packet.messageId })
    } catch (error) {
      resolveLog('warn', 'MQTT unsubscription failed', packet, error)
    }
  })

  const dispose = () => {
    pubsubManager.unsubscribeClient(publisher)
    client.destroy()
  }

  client.on('close', dispose)
  client.on('error', dispose)
  client.on('disconnect', dispose)
}

const sanitizeWildcardTopic = topic => (topic === '*' ? '+' : topic)

const createServerSocketIOHandler = pubsubManager => socket => {
  const publisher = (topicName, topicId, event) =>
    new Promise(resolve => {
      socket.emit(
        'message',
        JSON.stringify({
          topicName,
          topicId,
          payload: event
        }),
        resolve
      )
    })

  socket.on('subscribe', packet => {
    const subscriptions = JSON.parse(packet)
    for (const { topicName, topicId } of subscriptions) {
      pubsubManager.subscribe({
        client: publisher,
        topicName: sanitizeWildcardTopic(topicName),
        topicId: sanitizeWildcardTopic(topicId)
      })
    }
  })

  socket.on('unsubscribe', packet => {
    const unsubscriptions = JSON.parse(packet)
    for (const { topicName, topicId } of unsubscriptions) {
      pubsubManager.unsubscribe({
        client: publisher,
        topicName: sanitizeWildcardTopic(topicName),
        topicId: sanitizeWildcardTopic(topicId)
      })
    }
  })

  const dispose = () => {
    pubsubManager.unsubscribeClient(publisher)
  }

  socket.on('error', dispose)
  socket.on('disconnect', dispose)
}

const initSubscribeAdapter = async resolve => {
  const pubsubManager = createPubsubManager()
  const appId = resolve.applicationName
  const qos = 1

  try {
    const handler = createServerSocketIOHandler(pubsubManager)
    const socketIOServer = createSocketServer(resolve.server, {
      path: getRootBasedUrl(resolve.rootPath, '/api/socket-io/'),
      serveClient: false,
      transports: ['polling']
    })
    socketIOServer.on('connection', handler)
  } catch (error) {
    resolveLog('warn', 'Cannot init Socket.IO server socket: ', error)
  }

  try {
    const socketMqttServer = new WebSocketServer({
      server: resolve.server,
      path: getRootBasedUrl(resolve.rootPath, '/api/mqtt')
    })
    const handler = createServerMqttHandler(pubsubManager, appId, qos)
    socketMqttServer.on('connection', handler)
  } catch (error) {
    resolveLog('warn', 'Cannot init MQTT server socket: ', error)
  }

  Object.defineProperties(resolve, {
    pubsubManager: { value: pubsubManager }
  })
}

const initHMR = async resolve => {
  const HMR_ID = uuid()

  const HMRSocketHandler = socket => {
    socket.emit('hotModuleReload', HMR_ID)
  }

  const HMRSocketServer = createSocketServer(resolve.server, {
    path: getRootBasedUrl(resolve.rootPath, '/api/hmr/'),
    serveClient: false
  })

  HMRSocketServer.on('connection', HMRSocketHandler)
}

const emptyWorker = async () => {
  throw new Error(
    'Guard exception: worker should not be invoked on non-cloud environment'
  )
}

const initEventStore = async (
  { storageAdapter: createStorageAdapter, eventBroker: eventBrokerConfig },
  resolve
) => {
  const { zmqBrokerAddress, zmqConsumerAddress } = eventBrokerConfig

  const subSocket = zmq.socket('sub')
  await subSocket.connect(zmqBrokerAddress)

  const pubSocket = zmq.socket('pub')
  await pubSocket.connect(zmqConsumerAddress)

  Object.assign(resolve, {
    eventStore: createEventStore({
      storage: createStorageAdapter(),
      publishEvent: async event => {
        await pubSocket.send(`EVENT-TOPIC ${JSON.stringify(event)}`)
      }
    })
  })

  Object.defineProperties(resolve, {
    subSocket: { value: subSocket },
    pubSocket: { value: pubSocket }
  })
}

const processIncomingEvents = async (resolve, message) => {
  let unlock = null
  try {
    while (Promise.resolve(resolve.lockPromise) === resolve.lockPromise) {
      await resolve.lockPromise
    }
    resolve.lockPromise = new Promise(resolve => (unlock = resolve))

    const payloadIndex = message.indexOf(' ') + 1
    const [readModelName, instanceId] = message
      .toString('utf8', 0, payloadIndex - 1)
      .split('-')
      .map(str => new Buffer(str, 'base64').toString('utf8'))

    if (instanceId === resolve.instanceId) {
      const events = JSON.parse(message.slice(payloadIndex))
      const executor = resolve.executeQuery.getExecutor(readModelName)
      await executor.updateByEvents(events)
    }
  } catch (error) {
    resolveLog('error', 'Error while applying events to read-model', error)
  } finally {
    resolve.lockPromise = null
    unlock()
  }
}

const initDomain = async (
  {
    snapshotAdapter: createSnapshotAdapter,
    readModelAdapters: readModelAdaptersCreators
  },
  resolve
) => {
  const { eventStore, aggregates, readModels, viewModels } = resolve
  const snapshotAdapter = createSnapshotAdapter()

  const readModelAdapters = {}
  for (const { name, factory } of readModelAdaptersCreators) {
    readModelAdapters[name] = factory()
  }

  const executeCommand = createCommandExecutor({
    eventStore,
    aggregates,
    snapshotAdapter
  })

  const executeQuery = createQueryExecutor({
    doUpdateRequest: (pool, readModelName) => {
      const topic = `${new Buffer(readModelName).toString(
        'base64'
      )}-${new Buffer(resolve.instanceId).toString('base64')}`

      return resolve.subSocket.subscribe(topic)
    },
    eventStore,
    viewModels,
    readModels,
    readModelAdapters,
    snapshotAdapter
  })

  resolve.subSocket.on('message', processIncomingEvents.bind(null, resolve))

  Object.assign(resolve, {
    executeCommand,
    executeQuery
  })

  Object.defineProperties(resolve, {
    lockPromise: { value: null, writable: true },
    readModelAdapters: { value: readModelAdapters },
    snapshotAdapter: { value: snapshotAdapter }
  })
}

const getSubscribeAdapterOptions = async (resolve, origin, adapterName) => {
  if (adapterName !== 'mqtt' && adapterName !== 'socket.io') {
    return null
  }

  const { protocol, hostname, port } = Url.parse(origin)
  const isMqtt = adapterName === 'mqtt'
  const isSecure = /^https/.test(protocol)
  const targetProtocol = ['http', 'https', 'ws', 'wss'][isMqtt * 2 + isSecure]
  const targetPath = isMqtt ? '/api/mqtt' : '/api/socket-io/'
  const targetPort = port == null ? [80, 443][+isSecure] : port

  const url = `${targetProtocol}://${hostname}:${targetPort}${getRootBasedUrl(
    resolve.rootPath,
    targetPath
  )}`

  return {
    appId: resolve.applicationName,
    url
  }
}

const localEntry = async ({ assemblies, constants, domain, redux, routes }) => {
  try {
    const resolve = {
      instanceId: `${process.pid}${Math.floor(Math.random() * 100000)}`,
      aggregateActions: assemblies.aggregateActions,
      seedClientEnvs: assemblies.seedClientEnvs,
      ...constants,
      ...domain,
      redux,
      routes
    }

    resolve.getSubscribeAdapterOptions = getSubscribeAdapterOptions.bind(
      null,
      resolve
    )

    await initEventStore(assemblies, resolve)
    await initExpress(resolve)
    await initSubscribeAdapter(resolve)
    await initHMR(resolve)
    await initDomain(assemblies, resolve)

    const getCustomParameters = async () => ({ resolve })
    const executor = wrapApiHandler(mainHandler, getCustomParameters)

    resolve.app.use(
      getRootBasedUrl(resolve.rootPath, `/${resolve.staticPath}`),
      express.static(path.join(process.cwd(), resolve.distDir, './client'))
    )

    resolve.app.use(executor)

    await startExpressServer(resolve)

    resolveLog('debug', 'Local entry point cold start success', resolve)

    return emptyWorker
  } catch (error) {
    resolveLog('error', 'Local entry point cold start failure', error)
  }
}

export default localEntry
