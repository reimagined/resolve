import type { Event } from '@resolve-js/core'
import debugLevels from '@resolve-js/debug-levels'
import EventEmitter from 'events'
import http from 'http'
import WebSocket from 'ws'
import { v4 as uuid } from 'uuid'
import qs from 'querystring'
import jwt from 'jsonwebtoken'

import getRootBasedUrl from '../common/utils/get-root-based-url'
import { getSubscribeAdapterOptions } from './get-subscribe-adapter-options'
import { createPubSubManager, PubSubManager } from './create-pubsub-manager'
import { Adapter as EventstoreAdapter } from '@resolve-js/eventstore-base'

const log = debugLevels('resolve:runtime:local-subscribe-adapter')

const createWebSocketConnectionHandler = (
  pubSubManager: PubSubManager,
  eventstoreAdapter: EventstoreAdapter
) => (
  ws: WebSocket,
  req: {
    url: string
  }
) => {
  const queryString = req.url.split('?')[1]
  const { token, deploymentId } = qs.parse(queryString)
  const connectionId = uuid()

  let eventTypes = null
  let aggregateIds = null

  try {
    void ({ eventTypes, aggregateIds } = jwt.verify(
      token as string,
      deploymentId as string
    ) as any)
  } catch (error) {
    throw new Error('Permission denied, invalid token')
  }

  const publisher = (message: string) =>
    new Promise<void>((resolve, reject) => {
      return ws.send(message, (error) => {
        if (error != null) {
          reject(error)
        } else {
          resolve(undefined)
        }
      })
    })

  pubSubManager.connect(connectionId, {
    publisher,
    eventTypes,
    aggregateIds,
  })

  const dispose = () => {
    pubSubManager.disconnect(connectionId)
    ws.close()
  }

  const handler = createWebSocketMessageHandler(
    pubSubManager,
    eventstoreAdapter,
    ws,
    connectionId
  )

  ws.on('message', handler)
  ws.on('close', dispose)
  ws.on('error', dispose)
}

const createWebSocketMessageHandler = (
  pubSubManager: PubSubManager,
  eventstoreAdapter: EventstoreAdapter,
  ws: WebSocket,
  connectionId: string
) => async (message: string) => {
  const connection = pubSubManager.getConnection(connectionId)
  if (connection != null) {
    try {
      const { eventTypes, aggregateIds } = connection

      const { type, payload, requestId } = JSON.parse(message)
      switch (type) {
        case 'pullEvents': {
          const { events, cursor } = await eventstoreAdapter.loadEvents({
            eventTypes,
            aggregateIds,
            limit: 1000000,
            eventsSizeLimit: 124 * 1024,
            cursor: payload.cursor,
          })

          ws.send(
            JSON.stringify({
              type: 'pullEvents',
              requestId,
              payload: { events, cursor },
            })
          )

          break
        }
        default: {
          throw new Error(`The '${type}' message type is unknown`)
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
}

const initInterceptingHttpServer = (
  wsPath: string,
  server: http.Server,
  fakeWebsocketServer: http.Server
) => {
  const interceptingEvents = [
    'close',
    'listening',
    'request',
    'upgrade',
    'error',
    'connection',
  ]

  const interceptingEventListener = (
    eventName: string,
    listeners: Function[],
    ...args: any[]
  ) => {
    const requestUrl =
      args[0] != null && args[0].url != null ? String(args[0].url) : ''

    if (requestUrl.startsWith(wsPath)) {
      fakeWebsocketServer.emit(eventName, ...args)
    } else {
      for (const listener of listeners) {
        listener.apply(server, args)
      }
    }
  }

  for (const eventName of interceptingEvents) {
    const listeners = server.listeners(eventName).slice(0)
    server.removeAllListeners(eventName)
    const listener = interceptingEventListener.bind(null, eventName, listeners)
    server.on(eventName, listener)
  }
}

const initWebSocketServer = async (
  wsPath: string,
  server: http.Server,
  pubSubManager: PubSubManager,
  eventstoreAdapter: EventstoreAdapter
) => {
  try {
    const websocketServer = new WebSocket.Server({
      path: wsPath,
      server,
    })
    const connectionHandler = createWebSocketConnectionHandler(
      pubSubManager,
      eventstoreAdapter
    )
    websocketServer.on('connection', connectionHandler)
  } catch (error) {
    log.warn('Cannot init WebSocket server: ', error)
  }
}

const createFakeHttpServer = (): http.Server => {
  const socketServer = new EventEmitter()
  Object.setPrototypeOf(socketServer, http.Server.prototype)
  Object.defineProperty(socketServer, 'listen', { value: () => void 0 })
  return socketServer as http.Server
}

const initWebsockets = async (thisResolve: any) => {
  // thisResolve only here
  const {
    rootPath,
    server,
    assemblies: { eventstoreAdapter: createEventstoreAdapter },
  } = thisResolve
  // thisResolve only here

  const pubSubManager = createPubSubManager()
  const fakeHttpServer = createFakeHttpServer()
  const wsPath = getRootBasedUrl(rootPath, '/api/websocket')

  const sendReactiveEvent = async (event: Event) => {
    await pubSubManager.dispatch(event)
  }

  await initWebSocketServer(
    rootPath,
    fakeHttpServer,
    pubSubManager,
    await createEventstoreAdapter()
  )
  await initInterceptingHttpServer(wsPath, server, fakeHttpServer)

  return {
    getSubscribeAdapterOptions: {
      value: getSubscribeAdapterOptions,
    },
    sendReactiveEvent: { value: sendReactiveEvent },
  }
}

export default initWebsockets
