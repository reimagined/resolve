import debugLevels from '@resolve-js/debug-levels'
import EventEmitter from 'events'
import http from 'http'
import WebSocket from 'ws'
import { v4 as uuid } from 'uuid'
import qs from 'querystring'
import jwt from 'jsonwebtoken'
import { getRootBasedUrl } from '@resolve-js/core'

import { createPubSubManager } from './create-pubsub-manager'
import { getReactiveSubscriptionFactory } from './get-reactive-subscription-factory'

import type { Adapter as EventstoreAdapter } from '@resolve-js/eventstore-base'
import type { PubsubManager, ReactiveEventDispatcher } from '../common/types'

const log = debugLevels('resolve:runtime:local-subscribe-adapter')

// TODO: get rid of global variable!
let eventstoreAdapter: EventstoreAdapter

const createWebSocketConnectionHandler = (pubSubManager: PubsubManager) => (
  ws: WebSocket,
  req: http.IncomingMessage
) => {
  //TODO: check that req.url exist
  const queryString = (req.url as string).split('?')[1]
  const { token, deploymentId } = qs.parse(queryString)
  const connectionId = uuid()
  let eventTypes: string[] | null = null
  let aggregateIds: string[] | null = null

  try {
    void ({ eventTypes, aggregateIds } = jwt.verify(
      token as string,
      deploymentId as string
    ) as any)
  } catch (error) {
    throw new Error('Permission denied, invalid token')
  }

  //TODO: use ws.send callback?
  const publisher = async (event: string) => ws.send(event)
  pubSubManager.connect({
    client: publisher,
    connectionId,
    eventTypes,
    aggregateIds,
  })

  const dispose = () => {
    pubSubManager.disconnect({ connectionId })
    ws.close()
  }

  const handler = createWebSocketMessageHandler(pubSubManager, ws, connectionId)
  ws.on('message', handler)

  ws.on('close', dispose)
  ws.on('error', dispose)
}

const createWebSocketMessageHandler = (
  pubSubManager: PubsubManager,
  ws: WebSocket,
  connectionId: string
) => async (message: string) => {
  try {
    const connection = pubSubManager.getConnection({
      connectionId,
    })

    if (connection === undefined) {
      throw new Error(`Connection ${connectionId} does not exist`)
    }
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

const initInterceptingHttpServer = (
  server: http.Server,
  websocketHttpServer: http.Server,
  rootPath: string
) => {
  const websocketBaseUrl = getRootBasedUrl(rootPath, '/api/websocket')
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

    if (requestUrl.startsWith(websocketBaseUrl)) {
      void websocketHttpServer.emit(eventName, ...args)
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
  server: http.Server,
  pubSubManager: PubsubManager,
  rootPath: string
) => {
  try {
    const websocketServer = new WebSocket.Server({
      path: getRootBasedUrl(rootPath, '/api/websocket'),
      server,
    })
    const connectionHandler = createWebSocketConnectionHandler(pubSubManager)
    websocketServer.on('connection', connectionHandler)
  } catch (error) {
    log.warn('Cannot init WebSocket server: ', error)
  }
}

//TODO: look into this code. EventEmitter pretends to be http server!
const createSocketHttpServer = (): http.Server => {
  const socketServer = new EventEmitter()
  Object.setPrototypeOf(socketServer, http.Server.prototype)
  Object.defineProperty(socketServer, 'listen', {
    value: () => {
      return
    },
  })
  return socketServer as http.Server
}

type WebsocketServerFactoryParameters = {
  eventStoreAdapterFactory: () => EventstoreAdapter
  server: http.Server
  rootPath: string
  applicationName: string
}

export const websocketServerFactory = async (
  params: WebsocketServerFactoryParameters
) => {
  const { eventStoreAdapterFactory, rootPath, server, applicationName } = params
  const pubSubManager = createPubSubManager()
  const websocketHttpServer = createSocketHttpServer()

  eventstoreAdapter = await eventStoreAdapterFactory()

  const sendReactiveEvent: ReactiveEventDispatcher = async (event) => {
    await pubSubManager.dispatch({
      topicName: event.type,
      topicId: event.aggregateId,
      event,
    })
  }

  await initWebSocketServer(websocketHttpServer, pubSubManager, rootPath)
  await initInterceptingHttpServer(server, websocketHttpServer, rootPath)

  const getReactiveSubscription = getReactiveSubscriptionFactory({
    rootPath,
    applicationName,
  })

  return {
    getReactiveSubscription,
    sendReactiveEvent,
  }
}
