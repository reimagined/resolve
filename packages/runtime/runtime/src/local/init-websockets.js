import debugLevels from '@resolve-js/debug-levels'
import EventEmitter from 'events'
import http from 'http'
import WebSocket from 'ws'
import { v4 as uuid } from 'uuid'
import qs from 'querystring'
import jwt from 'jsonwebtoken'

import createPubsubManager from './create-pubsub-manager'
import getRootBasedUrl from '../common/utils/get-root-based-url'
import getSubscribeAdapterOptions from './get-subscribe-adapter-options'

const log = debugLevels('resolve:runtime:local-subscribe-adapter')

let eventstoreAdapter = null

const createWebSocketConnectionHandler = (resolve) => (ws, req) => {
  const { pubsubManager } = resolve
  const queryString = req.url.split('?')[1]
  const { token, deploymentId } = qs.parse(queryString)
  const connectionId = uuid()
  let eventTypes = null
  let aggregateIds = null

  try {
    void ({ eventTypes, aggregateIds } = jwt.verify(token, deploymentId))
  } catch (error) {
    throw new Error('Permission denied, invalid token')
  }

  const publisher = (event) => ws.send(event)
  pubsubManager.connect({
    client: publisher,
    connectionId,
    eventTypes,
    aggregateIds,
  })

  const dispose = () => {
    pubsubManager.disconnect({ connectionId })
    ws.close()
  }

  const handler = createWebSocketMessageHandler(resolve, ws, connectionId)
  ws.on('message', handler)

  ws.on('close', dispose)
  ws.on('error', dispose)
}

const createWebSocketMessageHandler = (
  { pubsubManager },
  ws,
  connectionId
) => async (message) => {
  try {
    const { eventTypes, aggregateIds } = pubsubManager.getConnection({
      connectionId,
    })

    const parsedMessage = JSON.parse(message)
    switch (parsedMessage.type) {
      case 'pullEvents': {
        const { events, cursor } = await eventstoreAdapter.loadEvents({
          eventTypes,
          aggregateIds,
          limit: 1000000,
          eventsSizeLimit: 124 * 1024,
          cursor: parsedMessage.cursor,
        })

        ws.send(
          JSON.stringify({
            type: 'pullEvents',
            payload: { events, cursor },
          })
        )

        break
      }
      default: {
        throw new Error(`The '${parsedMessage.type}' message type is unknown`)
      }
    }
  } catch (error) {
    // eslint-disable-next-line no-console
    console.warn(
      `Error while handling message from websocket: ${
        error != null && error.message != null
          ? `${error.message} ${error.stack}`
          : JSON.stringify(error)
      }`
    )
  }
}

const initInterceptingHttpServer = (resolve) => {
  const { server: baseServer, websocketHttpServer } = resolve
  const websocketBaseUrl = getRootBasedUrl(resolve.rootPath, '/api/websocket')
  const interceptingEvents = [
    'close',
    'listening',
    'request',
    'upgrade',
    'error',
    'connection',
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

const initWebSocketServer = async (resolve) => {
  try {
    const websocketServer = new WebSocket.Server({
      path: getRootBasedUrl(resolve.rootPath, '/api/websocket'),
      server: resolve.websocketHttpServer,
    })
    const connectionHandler = createWebSocketConnectionHandler(resolve)
    websocketServer.on('connection', connectionHandler)
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

const initWebsockets = async (resolve) => {
  const pubsubManager = createPubsubManager()
  const websocketHttpServer = createSocketHttpServer()

  eventstoreAdapter = await resolve.assemblies.eventstoreAdapter()

  const sendReactiveEvent = async (event) => {
    await resolve.pubsubManager.dispatch({
      topicName: event.type,
      topicId: event.aggregateId,
      event,
    })
  }

  Object.defineProperties(resolve, {
    getSubscribeAdapterOptions: {
      value: getSubscribeAdapterOptions,
    },
    pubsubManager: { value: pubsubManager },
    websocketHttpServer: { value: websocketHttpServer },
    sendReactiveEvent: { value: sendReactiveEvent },
  })

  await initWebSocketServer(resolve)

  await initInterceptingHttpServer(resolve)
}

export default initWebsockets
