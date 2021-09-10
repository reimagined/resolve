import debugLevels from '@resolve-js/debug-levels'
import EventEmitter from 'events'
import http from 'http'
import WebSocket from 'ws'
import { v4 as uuid } from 'uuid'
import qs from 'querystring'
import jwt from 'jsonwebtoken'
import { getRootBasedUrl } from '@resolve-js/core'

import createPubsubManager from './create-pubsub-manager'
import getSubscribeAdapterOptions from './get-subscribe-adapter-options'

import type { Event } from '@resolve-js/core'
import type { Adapter as EventstoreAdapter } from '@resolve-js/eventstore-base'
import type { Resolve } from '../common/types'

const log = debugLevels('resolve:runtime:local-subscribe-adapter')

// TODO: get rid of global variable!
let eventstoreAdapter: EventstoreAdapter

const createWebSocketConnectionHandler = (resolve: Resolve) => (
  ws: WebSocket,
  req: http.IncomingMessage
) => {
  const { pubsubManager } = resolve
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
  { pubsubManager }: Resolve,
  ws: WebSocket,
  connectionId: string
) => async (message: string) => {
  try {
    const connection = pubsubManager.getConnection({
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

const initInterceptingHttpServer = (resolve: Resolve) => {
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

const initWebSocketServer = async (resolve: Resolve) => {
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

//TODO: look into this code. EventEmitter pretends to be http server!
const createSocketHttpServer = () => {
  const socketServer = new EventEmitter()
  Object.setPrototypeOf(socketServer, http.Server.prototype)
  Object.defineProperty(socketServer, 'listen', {
    value: () => {
      return
    },
  })
  return socketServer as http.Server
}

const initWebsockets = async (resolve: Resolve) => {
  const pubsubManager = createPubsubManager()
  const websocketHttpServer = createSocketHttpServer()

  eventstoreAdapter = await resolve.assemblies.eventstoreAdapter()

  const sendReactiveEvent = async (
    event: Pick<Event, 'type' | 'aggregateId'>
  ) => {
    await resolve.pubsubManager.dispatch({
      topicName: event.type,
      topicId: event.aggregateId,
      event,
    })
  }

  resolve.getSubscribeAdapterOptions = getSubscribeAdapterOptions
  resolve.pubsubManager = pubsubManager
  resolve.websocketHttpServer = websocketHttpServer
  resolve.sendReactiveEvent = sendReactiveEvent

  await initWebSocketServer(resolve)

  await initInterceptingHttpServer(resolve)
}

export default initWebsockets
