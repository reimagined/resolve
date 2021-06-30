import { Domain, Event, SecretsManager } from '@resolve-js/core'
import { Adapter as EventstoreAdapter } from '@resolve-js/eventstore-base'
import debugLevels from '@resolve-js/debug-levels'
import EventEmitter from 'events'
import http from 'http'
import WebSocket from 'ws'
import { v4 as uuid } from 'uuid'
import qs from 'querystring'
import jwt from 'jsonwebtoken'

import getRootBasedUrl from '../common/utils/get-root-based-url'
import { makeSubscription } from './make-subscription'
import {
  createPubSubManager,
  PubSubManager,
  ViewModelConnection,
} from './create-pubsub-manager'

const getLog = (scope: string) => debugLevels(`resolve:runtime:ws:${scope}`)

enum ConnectionRequestKind {
  viewModel = 'viewModel',
  readModel = 'readModel',
}

type ConnectionRequest = {
  kind: ConnectionRequestKind
}

type ViewModelConnectionRequest = ConnectionRequest & {
  kind: ConnectionRequestKind.viewModel
  token: string
  deploymentId: string
}

type ReadModelConnectionRequest = ConnectionRequest & {
  kind: ConnectionRequestKind.readModel
  name: string
  channel: string
  permit: string
}

const createViewModelMessageHandler = (
  pubSubManager: PubSubManager,
  eventstoreAdapter: EventstoreAdapter,
  ws: WebSocket,
  connectionId: string
) => async (message: string) => {
  const connection = pubSubManager.getConnection(
    connectionId
  ) as ViewModelConnection
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

const connectViewModel = async (
  pubSubManager: PubSubManager,
  eventstoreAdapter: EventstoreAdapter,
  ws: WebSocket,
  connectionRequest: ViewModelConnectionRequest
) => {
  const { token, deploymentId } = connectionRequest
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

  const handler = createViewModelMessageHandler(
    pubSubManager,
    eventstoreAdapter,
    ws,
    connectionId
  )

  ws.on('message', handler)
  ws.on('close', dispose)
  ws.on('error', dispose)
}

const connectReadModel = async (
  domainInterop: Domain,
  pubSubManager: PubSubManager,
  secretsManager: SecretsManager,
  ws: WebSocket,
  connectionRequest: ReadModelConnectionRequest
) => {
  const { channel, permit, name } = connectionRequest
  const log = getLog(`connect-read-model:${name}`)

  log.debug(`acquiring read models interop`)
  const readModels = domainInterop.readModelDomain.acquireReadModelsInterop({
    secretsManager,
  })

  log.verbose(readModels)

  const readModelInterop = readModels[name]

  if (!readModelInterop) {
    log.error(`read-model interop not found`)
    throw Error(`Permission denied`)
  }

  log.debug(`acquiring channel interop`)
  const channelInterop = await readModelInterop.acquireChannel()

  if (channelInterop == null) {
    log.error(`read-model does not support channeling`)
    throw Error(`Permission denied`)
  }

  let connectionAllowed = false
  try {
    log.debug(`checking channel permissions`)
    connectionAllowed = await channelInterop.checkPermissions(channel, permit)
  } catch (error) {
    log.error(error)
  }

  if (!connectionAllowed) {
    log.debug(`checking channel permissions failed`)
    throw Error(`Permission denied`)
  }

  const connectionId = uuid()

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
    channel,
  })

  const dispose = () => {
    pubSubManager.disconnect(connectionId)
    ws.close()
  }

  ws.on('message', (message: string) => {
    const log = getLog(`read-model:on-message`)
    log.warn(message)
  })
  ws.on('close', dispose)
  ws.on('error', dispose)
}

const createWebSocketConnectionHandler = (
  pubSubManager: PubSubManager,
  eventstoreAdapter: EventstoreAdapter,
  secretsManager: SecretsManager,
  domainInterop: Domain
) => async (
  ws: WebSocket,
  req: {
    url: string
  }
) => {
  const queryString = req.url.split('?')[1]
  const connectionRequest = qs.parse(queryString) as
    | ViewModelConnectionRequest
    | ReadModelConnectionRequest
  if (connectionRequest.kind === 'viewModel') {
    await connectViewModel(
      pubSubManager,
      eventstoreAdapter,
      ws,
      connectionRequest
    )
  } else {
    await connectReadModel(
      domainInterop,
      pubSubManager,
      secretsManager,
      ws,
      connectionRequest
    )
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
  eventstoreAdapter: EventstoreAdapter,
  domainInterop: Domain
) => {
  const log = getLog('initWebsocketServer')
  log.debug(`acquiring secrets manager`)

  const secretsManager = await eventstoreAdapter.getSecretsManager()

  try {
    const websocketServer = new WebSocket.Server({
      path: wsPath,
      server,
    })
    const connectionHandler = createWebSocketConnectionHandler(
      pubSubManager,
      eventstoreAdapter,
      secretsManager,
      domainInterop
    )
    websocketServer.on('connection', connectionHandler)
  } catch (error) {
    log.warn('Cannot init WebSocket server: ', error)
  }
}

const createProxyServer = (): http.Server => {
  const proxyServer = new EventEmitter()
  Object.setPrototypeOf(proxyServer, http.Server.prototype)
  Object.defineProperty(proxyServer, 'listen', { value: () => void 0 })
  return proxyServer as http.Server
}

export const initWebsockets = async (thisResolve: any) => {
  // thisResolve only here
  const {
    rootPath,
    server,
    assemblies: { eventstoreAdapter: createEventstoreAdapter },
    domainInterop,
  } = thisResolve
  // thisResolve only here

  const pubSubManager = createPubSubManager()
  const proxyServer = createProxyServer()
  const wsPath = getRootBasedUrl(rootPath, '/api/websocket')

  const sendReactiveEvent = async (event: Event) => {
    await pubSubManager.dispatchEvent(event)
  }
  const publishReadModelNotification = async (
    channel: never,
    notification: never
  ) => {
    const log = getLog('publishReadModelNotification')
    log.verbose(`publishing RM notification to channel ${channel}`)
    //await pubSubManager
  }

  await initWebSocketServer(
    rootPath,
    proxyServer,
    pubSubManager,
    await createEventstoreAdapter(),
    domainInterop
  )
  await initInterceptingHttpServer(wsPath, server, proxyServer)

  return {
    makeSubscription: {
      value: makeSubscription,
    },
    sendReactiveEvent: { value: sendReactiveEvent },
  }
}
