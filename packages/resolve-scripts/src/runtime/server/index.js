import path from 'path'
import { Server } from 'http'
import express from 'express'
import cookieParser from 'cookie-parser'
import bodyParser from 'body-parser'

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

import staticDir from '$resolve.staticDir'
import distDir from '$resolve.distDir'
import jwtCookie from '$resolve.jwtCookie'

subscribeAdapter.init().then(() => {
  eventStore.subscribeOnBus(event => {
    pubsubManager.dispatch({
      topicName: event.type,
      topicId: event.aggregateId,
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

app.use(
  getRootBasedUrl('/api/query/:modelName/:modelOptions'),
  argumentsParser,
  queryHandler
)
app.use(getRootBasedUrl('/api/status'), argumentsParser, statusHandler)
app.use(getRootBasedUrl('/api/subscribe'), argumentsParser, subscribeHandler)

app.use(getRootBasedUrl('/api/commands'), commandHandler)

app.use(getRootBasedUrl('/'), express.static(`${distDir}/client`))
app.use(getRootBasedUrl('/'), express.static(staticDir))
app.use(
  getRootBasedUrl('/'),
  express.static(path.resolve(__dirname, '../static'))
)

app.get([getRootBasedUrl('/'), getRootBasedUrl('/*')], serverSideRendering)

sagaRunner()

startServer(server)
