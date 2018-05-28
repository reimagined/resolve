import path from 'path'
import { Server } from 'http'
import express from 'express'
import createSocketServer from 'socket.io'
import cookieParser from 'cookie-parser'
import bodyParser from 'body-parser'

import getRootableUrl from './utils/get_rootable_url'
import serverSideRendering from './server_side_rendering'
import startServer from './start_server'
import commandHandler from './command_handler'
import statusHandler from './status_handler'
import queryHandler from './query_handler'
import socketHandler from './socket_handler'
import sagaRunner from './saga_runner'
import assignAuthRoutes from './assign_auth_routes'

import staticDir from '$resolve.staticDir'
import distDir from '$resolve.distDir'
import jwtCookie from '$resolve.jwtCookie'

const app = express()
const server = new Server(app)

const socket = createSocketServer(server, {
  path: getRootableUrl('/socket/'),
  serveClient: false
})

socket.on('connection', socketHandler)

app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: true }))
app.use(cookieParser())

app.use((req, res, next) => {
  req.jwtToken = req.cookies[jwtCookie.name]
  req.socket = socket

  next()
})

assignAuthRoutes(app)

app.use(getRootableUrl('/api/commands'), commandHandler)
app.use(getRootableUrl('/api/query/:modelName/:resolverName?'), queryHandler)
app.use(getRootableUrl('/api/status'), statusHandler)

app.use(getRootableUrl('/'), express.static(`${distDir}/client`))
app.use(getRootableUrl('/'), express.static(staticDir))
app.use(
  getRootableUrl('/'),
  express.static(path.resolve(__dirname, '../static'))
)

app.get([getRootableUrl('/'), getRootableUrl('/*')], serverSideRendering)

sagaRunner()

startServer(server)
