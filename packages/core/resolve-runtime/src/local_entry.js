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

import createPubsubManager from './utils/create_pubsub_manager'
import getRootBasedUrl from './utils/get_root_based_url'
import println from './utils/println'

import startExpressServer from './utils/start_express_server'
import sagaRunnerExpress from './utils/saga_runner_express'

import mainHandler from './handlers/main_handler'

const initEventStore = async (
  { storageAdapter: createStorageAdapter, busAdapter: createBusAdapter },
  resolve
) => {
  Object.assign(resolve, {
    eventStore: createEventStore({
      storage: createStorageAdapter(),
      bus: createBusAdapter()
    })
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

const createServerMqttHandler = (pubsubManager, callback, appId, qos) => ws => {
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
    callback()
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
      // eslint-disable-next-line no-console
      console.warn(packet)
      // eslint-disable-next-line no-console
      console.warn(error)
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
      // eslint-disable-next-line no-console
      console.warn(packet)
      // eslint-disable-next-line no-console
      console.warn(error)
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
      serveClient: false
    })
    socketIOServer.on('connection', handler)
  } catch (error) {
    // eslint-disable-next-line no-console
    console.log('Cannot init Socket.IO server socket: ', error)
  }

  try {
    const socketMqttServer = new WebSocketServer({
      server: resolve.server,
      path: getRootBasedUrl(resolve.rootPath, '/api/mqtt')
    })
    const handler = createServerMqttHandler(pubsubManager, resolve, appId, qos)
    socketMqttServer.on('connection', handler)
  } catch (error) {
    // eslint-disable-next-line no-console
    console.log('Cannot init MQTT server socket: ', error)
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

const initDomain = async (
  { snapshotAdapter: createSnapshotAdapter },
  resolve
) => {
  const { eventStore, aggregates, readModels, viewModels } = resolve
  const snapshotAdapter = createSnapshotAdapter()

  const executeCommand = createCommandExecutor({
    eventStore,
    aggregates,
    snapshotAdapter
  })

  const executeQuery = createQueryExecutor({
    eventStore,
    viewModels,
    readModels,
    snapshotAdapter
  })

  Object.assign(resolve, {
    executeCommand,
    executeQuery
  })

  Object.defineProperty(resolve, 'snapshotAdapter', {
    value: snapshotAdapter
  })
}

const initEventLoop = async resolve => {
  const executors = Array.from(resolve.executeQuery.getExecutors().values())

  const unsubscribe = await resolve.eventStore.loadEvents(
    { skipStorage: true },
    async event => {
      resolve.pubsubManager.dispatch({
        topicName: event.type,
        topicId: event.aggregateId,
        event
      })

      const applicationPromises = []
      // In multi-instance mode application developer should give a guarantee
      // that every read/view-model had been updated only from singular instance
      // Updating read/view-model from multiple threads is not supported
      for (const executor of executors) {
        applicationPromises.push(executor.updateByEvents([event]))
      }

      await Promise.all(applicationPromises)
    }
  )

  Object.defineProperty(resolve, 'unsubscribe', {
    value: unsubscribe
  })
}

const getSubscribeAdapterOptions = async (resolve, origin, adapterName) => {
  switch (adapterName) {
    case 'mqtt': {
      const { protocol, hostname, port } = Url.parse(origin)
      const wsProtocol = /^https/.test(protocol) ? 'wss' : 'ws'

      const url = `${wsProtocol}://${hostname}:${port}${getRootBasedUrl(
        resolve.rootPath,
        '/api/mqtt'
      )}`
      return {
        appId: resolve.applicationName,
        url
      }
    }

    case 'socket.io': {
      return {
        appId: resolve.applicationName,
        url: getRootBasedUrl(resolve.rootPath, '/api/socket-io/')
      }
    }

    default:
      return null
  }
}

const localEntry = async ({ assemblies, constants, domain, redux, routes }) => {
  try {
    const resolve = {
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
    await initEventLoop(resolve)

    const getCustomParameters = async () => ({ resolve })
    const executor = wrapApiHandler(mainHandler, getCustomParameters)

    resolve.app.use(
      getRootBasedUrl(resolve.rootPath, `/${resolve.staticPath}`),
      express.static(path.join(process.cwd(), resolve.distDir, './client'))
    )

    resolve.app.use(executor)

    await sagaRunnerExpress(resolve, assemblies.sagas)
    await startExpressServer(resolve)

    return emptyWorker
  } catch (error) {
    println(error)
  }
}

export default localEntry
