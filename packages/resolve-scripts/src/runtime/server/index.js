import path from 'path'
import { Server } from 'http'
import express from 'express'
//import createSocketServer from 'socket.io'
import cookieParser from 'cookie-parser'
import bodyParser from 'body-parser'
//import { Server as WebSocketServer } from 'ws'

import getRootBasedUrl from './utils/get_root_based_url'
import serverSideRendering from './server_side_rendering'
import startServer from './start_server'
import commandHandler from './command_handler'
import statusHandler from './status_handler'
import queryHandler from './query_handler'
// import socketHandler from './socket_handler'
// import mqttHandler from './mqtt_handler';
import sagaRunner from './saga_runner'
import assignAuthRoutes from './assign_auth_routes'
import eventStore from './event_store'
import pubsubManager from './pubsub_manager'

import staticDir from '$resolve.staticDir'
import distDir from '$resolve.distDir'
import jwtCookie from '$resolve.jwtCookie'
import serverSubscribeAdapter from '$resolve.subscribeAdapter'

const app = express()
const server = new Server(app)

// const socketIOServer = createSocketServer(server, {
//   path: getRootBasedUrl('/socket/'),
//   serveClient: false
// })
//
// socketIOServer.on('connection', socketHandler)

const createSubscribeAdapter = serverSubscribeAdapter.module

// TODO !!!!
const subscribeAdapter = createSubscribeAdapter({
  pubsubManager,
  server,
  getRootBasedUrl,
  qos: 1,
  appId: '1234',
  ...serverSubscribeAdapter.options
})

subscribeAdapter.init().then(() => {
  console.log('subscribeAdapter.init()')
  eventStore.subscribeOnBus(event => {
    console.log('event', event)
    pubsubManager.dispatch({
      topicName: event.aggregateId,
      topicId: event.type,
      event
    })
  })
})

app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: true }))
app.use(cookieParser())

app.use((req, res, next) => {
  req.jwtToken = req.cookies[jwtCookie.name]

  next()
})

assignAuthRoutes(app)

app.use(getRootBasedUrl('/api/commands'), commandHandler)
app.use(getRootBasedUrl('/api/query'), queryHandler)
app.use(getRootBasedUrl('/api/status'), statusHandler)

app.use(getRootBasedUrl('/'), express.static(`${distDir}/client`))
app.use(getRootBasedUrl('/'), express.static(staticDir))
app.use(
  getRootBasedUrl('/'),
  express.static(path.resolve(__dirname, '../static'))
)

app.get([getRootBasedUrl('/'), getRootBasedUrl('/*')], serverSideRendering)

sagaRunner()

startServer(server)
