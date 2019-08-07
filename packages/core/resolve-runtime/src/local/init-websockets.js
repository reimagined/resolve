import debugLevels from 'resolve-debug-levels'
import EventEmitter from 'events'
import http from 'http'
import MqttConnection from 'mqtt-connection'
import createSocketServer from 'socket.io'
import getWebSocketStream from 'websocket-stream'
import { Server as WebSocketServer } from 'ws'
import uuid from 'uuid/v4'

import createPubsubManager from './create-pubsub-manager'
import getRootBasedUrl from '../common/utils/get-root-based-url'
import getSubscribeAdapterOptions from './get-subscribe-adapter-options'

const log = debugLevels('resolve:resolve-runtime:local-subscribe-adapter')

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
      log.warn('MQTT subscription failed', packet, error)
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
      log.warn('MQTT unsubscription failed', packet, error)
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

const initInterceptingHttpServer = resolve => {
  const {
    server: baseServer,
    socketIOHttpServer,
    mqttHttpServer,
    hmrHttpServer
  } = resolve

  const socketIoBaseUrl = getRootBasedUrl(resolve.rootPath, '/api/socket-io/')
  const mqttBaseUrl = getRootBasedUrl(resolve.rootPath, '/api/mqtt')
  const hmrBaseUrl = getRootBasedUrl(resolve.rootPath, '/api/hmr/')

  const interceptingEvents = [
    'close',
    'listening',
    'request',
    'upgrade',
    'error'
  ]

  const interceptingEventListener = (eventName, listeners, ...args) => {
    const requestUrl =
      args[0] != null && args[0].url != null ? String(args[0].url) : ''

    if (requestUrl.startsWith(socketIoBaseUrl)) {
      socketIOHttpServer.emit(eventName, ...args)
    } else if (requestUrl.startsWith(mqttBaseUrl)) {
      mqttHttpServer.emit(eventName, ...args)
    } else if (requestUrl.startsWith(hmrBaseUrl)) {
      hmrHttpServer.emit(eventName, ...args)
    } else {
      for (const listener of listeners) {
        listener.apply(baseServer, args)
      }
    }
  }

  for (const eventName of interceptingEvents) {
    const listeners = baseServer.listeners(eventName).slice(0)
    baseServer.removeAllListeners(eventName)
    const listener = interceptingEventListener.bind(null, eventName, listeners)
    baseServer.on(eventName, listener)
  }
}

const initSocketIOServer = async resolve => {
  try {
    const handler = createServerSocketIOHandler(resolve.pubsubManager)
    const socketIOServer = createSocketServer(resolve.socketIOHttpServer, {
      path: getRootBasedUrl(resolve.rootPath, '/api/socket-io/'),
      serveClient: false,
      transports: ['polling', 'websocket']
    })
    socketIOServer.on('connection', handler)
  } catch (error) {
    log.warn('Cannot init Socket.IO server socket: ', error)
  }
}

const initMqttServer = async resolve => {
  const appId = resolve.applicationName
  const qos = 1
  try {
    const socketMqttServer = new WebSocketServer({
      path: getRootBasedUrl(resolve.rootPath, '/api/mqtt'),
      server: resolve.mqttHttpServer
    })
    const handler = createServerMqttHandler(resolve.pubsubManager, appId, qos)
    socketMqttServer.on('connection', handler)
  } catch (error) {
    log.warn('Cannot init MQTT server socket: ', error)
  }
}

const initHMRServer = async resolve => {
  const HMR_ID = uuid()

  const HMRSocketHandler = socket => {
    socket.emit('hotModuleReload', HMR_ID)
  }

  const HMRSocketServer = createSocketServer(resolve.hmrHttpServer, {
    path: getRootBasedUrl(resolve.rootPath, '/api/hmr/'),
    serveClient: false
  })

  HMRSocketServer.on('connection', HMRSocketHandler)
}

const createSocketHttpServer = () => {
  const socketServer = new EventEmitter()
  Object.setPrototypeOf(socketServer, http.Server.prototype)
  Object.defineProperty(socketServer, 'listen', { value: () => {} })
  return socketServer
}

const initWebsockets = async resolve => {
  const pubsubManager = createPubsubManager()
  const socketIOHttpServer = createSocketHttpServer()
  const mqttHttpServer = createSocketHttpServer()
  const hmrHttpServer = createSocketHttpServer()

  Object.defineProperties(resolve, {
    getSubscribeAdapterOptions: {
      value: getSubscribeAdapterOptions.bind(null, resolve)
    },
    pubsubManager: { value: pubsubManager },
    socketIOHttpServer: { value: socketIOHttpServer },
    mqttHttpServer: { value: mqttHttpServer },
    hmrHttpServer: { value: hmrHttpServer }
  })

  await initSocketIOServer(resolve)
  await initMqttServer(resolve)
  await initHMRServer(resolve)

  await initInterceptingHttpServer(resolve)
}

export default initWebsockets
