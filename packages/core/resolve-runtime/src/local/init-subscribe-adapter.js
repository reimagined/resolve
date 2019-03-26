import getWebSocketStream from 'websocket-stream'
import MqttConnection from 'mqtt-connection'
import createSocketServer from 'socket.io'
import { Server as WebSocketServer } from 'ws'

import createPubsubManager from './create_pubsub_manager'
import getRootBasedUrl from '../common/utils/get-root-based-url'
import getSubscribeAdapterOptions from './get-subscribe-adapter-options'

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
    getSubscribeAdapterOptions: {
      value: getSubscribeAdapterOptions.bind(null, resolve)
    },
    pubsubManager: { value: pubsubManager }
  })
}

export default initSubscribeAdapter
