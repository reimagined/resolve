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
import assignAuthRoutes from './assign_auth_routes'
import eventStore from './event_store'
import pubsubManager from './pubsub_manager'
import subscribeHandler from './subscribe_handler'
import subscribeAdapter from './subscribe_adapter'
import argumentsParser from './arguments_parser'
import HMRSocketHandler from './hmr_socket_handler'

import {
  staticPath,
  staticDir,
  distDir,
  jwtCookie,
  rootPath
} from './assemblies'

subscribeAdapter.init().then(() => {
  eventStore.subscribeOnBus(event => {
    pubsubManager.dispatch({
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

app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: true }))
app.use(cookieParser())

app.use((req, res, next) => {
  req.jwtToken = req.cookies[jwtCookie.name]

  next()
})

assignAuthRoutes(app)

app.use(
  getRootBasedUrl(rootPath, '/api/query/:modelName/:modelOptions'),
  argumentsParser,
  queryHandler
)
app.use(
  getRootBasedUrl(rootPath, '/api/status'),
  argumentsParser,
  statusHandler
)
app.use(
  getRootBasedUrl(rootPath, '/api/subscribe'),
  argumentsParser,
  subscribeHandler
)

app.use(getRootBasedUrl(rootPath, '/api/commands'), commandHandler)

app.use(
  getRootBasedUrl(rootPath, `/${staticPath}`),
  express.static(`${distDir}/client`)
)
app.use(getRootBasedUrl(rootPath, `/${staticPath}`), express.static(staticDir))

app.get(
  [getRootBasedUrl(rootPath, '/'), getRootBasedUrl(rootPath, '/!*')],
  serverSideRendering
)

sagaRunner()

startServer(server)
