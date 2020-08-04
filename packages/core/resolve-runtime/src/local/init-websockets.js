import debugLevels from 'resolve-debug-levels'
import EventEmitter from 'events'
import http from 'http'
import WebSocket from 'ws'
import uuid from 'uuid/v4'
import qs from 'querystring'
import jwt from 'jsonwebtoken'

import createPubsubManager from './create-pubsub-manager'
import getRootBasedUrl from '../common/utils/get-root-based-url'
import getSubscribeAdapterOptions from './get-subscribe-adapter-options'

const log = debugLevels('resolve:resolve-runtime:local-subscribe-adapter')

const createServerWebSocketHandler = pubsubManager => (ws, req) => {
  const queryString = req.url.split('?')[1]
  const { token, deploymentId } = qs.parse(queryString)
  const connectionId = uuid()
  let topics = null

  try {
    ;({ topics } = jwt.verify(token, deploymentId))
  } catch (error) {
    throw new Error('Permission denied, invalid token')
  }

  const publisher = event => ws.send(event)
  pubsubManager.connect({
    client: publisher,
    connectionId,
    topics
  })

  const dispose = () => {
    pubsubManager.disconnect({ connectionId })
    ws.close()
  }

  ws.on('close', dispose)
  ws.on('error', dispose)
}

const initInterceptingHttpServer = resolve => {
  const { server: baseServer, websocketHttpServer } = resolve

  const websocketBaseUrl = getRootBasedUrl(resolve.rootPath, '/api/websocket/')

  const interceptingEvents = [
    'close',
    'listening',
    'request',
    'upgrade',
    'error',
    'connection'
  ]

  const interceptingEventListener = (eventName, listeners, ...args) => {
    const requestUrl =
      args[0] != null && args[0].url != null ? String(args[0].url) : ''

    if (requestUrl.startsWith(websocketBaseUrl)) {
      websocketHttpServer.emit(eventName, ...args)
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

const initWebSocketServer = async resolve => {
  try {
    const websocketServer = new WebSocket.Server({
      port: 8080, // TODO: change port?
      path: getRootBasedUrl(resolve.rootPath, '/api/websocket'),
      server: resolve.websocketHttpServer
    })
    const handler = createServerWebSocketHandler(resolve.pubsubManager)
    websocketServer.on('connection', handler)
  } catch (error) {
    log.warn('Cannot init WebSocket server: ', error)
  }
}

const createSocketHttpServer = () => {
  const socketServer = new EventEmitter()
  Object.setPrototypeOf(socketServer, http.Server.prototype)
  Object.defineProperty(socketServer, 'listen', { value: () => {} })
  return socketServer
}

const initWebsockets = async resolve => {
  const pubsubManager = createPubsubManager()
  const websocketHttpServer = createSocketHttpServer()

  Object.defineProperties(resolve, {
    getSubscribeAdapterOptions: {
      value: getSubscribeAdapterOptions
    },
    pubsubManager: { value: pubsubManager },
    websocketHttpServer: { value: websocketHttpServer }
  })

  await initWebSocketServer(resolve)

  await initInterceptingHttpServer(resolve)
}

export default initWebsockets
