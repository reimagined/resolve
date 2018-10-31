import 'source-map-support/register'
import express from 'express'
import cookieParser from 'cookie-parser'
import bodyParser from 'body-parser'
import createSocketServer from 'socket.io'

import { app, server } from './server'
import getRootBasedUrl from './utils/get_root_based_url'
import serverSideRendering from './server_side_rendering'
import startServer from './start_server'
import commandHandler from './command_handler'
import statusHandler from './status_handler'
import queryHandler from './query_handler'
import sagaRunner from './saga_runner'
import eventStore from './event_store'
import pubsubManager from './pubsub_manager'
import subscribeHandler from './subscribe_handler'
import subscribeAdapter from './subscribe_adapter'
import argumentsParser from './arguments_parser'
import HMRSocketHandler from './hmr_socket_handler'
import provideJwtMiddleware from './provide_jwt_middleware'
import registerApiHandlers from './register_api_handlers'

import { staticPath, distDir, rootPath } from './assemblies'

subscribeAdapter.init().then(() => {
  eventStore.loadEvents({ skipStorage: true }, async event => {
    await pubsubManager.dispatch({
      topicName: event.type,
      topicId: event.aggregateId,
      event
    })
  })
})

const HMRSocketServer = createSocketServer(server, {
  path: getRootBasedUrl(rootPath, '/api/hmr/'),
  serveClient: false
})

HMRSocketServer.on('connection', HMRSocketHandler)

app.use(cookieParser())
app.use(provideJwtMiddleware)

const bodyParserJson = bodyParser.json()
const bodyParserUrlencoded = bodyParser.urlencoded({ extended: true })

app.use(
  getRootBasedUrl(rootPath, '/api/query/:modelName/:modelOptions'),
  bodyParserJson,
  bodyParserUrlencoded,
  argumentsParser,
  queryHandler
)
app.use(
  getRootBasedUrl(rootPath, '/api/status'),
  bodyParserJson,
  bodyParserUrlencoded,
  argumentsParser,
  statusHandler
)
app.use(
  getRootBasedUrl(rootPath, '/api/subscribe'),
  bodyParserJson,
  bodyParserUrlencoded,
  argumentsParser,
  subscribeHandler
)

app.use(
  getRootBasedUrl(rootPath, '/api/commands'),
  bodyParserJson,
  bodyParserUrlencoded,
  commandHandler
)

registerApiHandlers()

app.use(
  getRootBasedUrl(rootPath, `/${staticPath}`),
  express.static(`${distDir}/client`)
)

app.get(
  [getRootBasedUrl(rootPath, '/'), getRootBasedUrl(rootPath, '/*')],
  bodyParserJson,
  bodyParserUrlencoded,
  serverSideRendering
)

sagaRunner()

startServer(server)
