import bodyParser from 'body-parser'
import chalk from 'chalk'
import cookieParser from 'cookie-parser'
import express from 'express'
import jwt from 'jsonwebtoken'
import path from 'path'
import { createReadModel, createViewModel, createFacade } from 'resolve-query'
import commandHandler from 'resolve-command'
import request from 'request'
import passport from 'passport'

import { raiseError } from './utils/error_handling.js'
import { getRootableUrl } from './utils/prepare_urls'
import eventStore from './event_store'
import ssr from './render'
import { getRouteByName } from './auth'

import config from '../configs/server.config.js'
import message from './message'

const READ_MODEL_SUBSCRIPTION_TIME_TO_LIVE = 300000
const STATIC_PATH = '/static'

const app = express()

app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: true }))
app.use(cookieParser())

let jwtSecret = process.env.JWT_SECRET || 'DefaultSecret'

if (
  !process.env.hasOwnProperty('JWT_SECRET') &&
  process.env.NODE_ENV === 'production'
) {
  raiseError(
    'Jwt secret must be specified in production mode by JWT_SECRET environment variable'
  )
}

if (!Array.isArray(config.readModels)) {
  raiseError(message.readModelsArrayFormat, config.readModels)
}

if (!Array.isArray(config.viewModels)) {
  raiseError(message.viewModelsArrayFormat, config.viewModels)
}

const queryExecutors = {}

config.readModels.forEach(readModel => {
  if (!readModel.name && config.readModels.length === 1) {
    readModel.name = 'default'
  } else if (!readModel.name) {
    raiseError(message.readModelMandatoryName, readModel)
  } else if (queryExecutors[readModel.name]) {
    raiseError(message.dublicateName, readModel)
  }

  const facade = createFacade({
    model: createReadModel({
      projection: readModel.projection,
      adapter: readModel.adapter,
      eventStore
    }),
    resolvers: readModel.resolvers
  })

  queryExecutors[readModel.name] = facade.executeQuery

  queryExecutors[readModel.name].makeSubscriber = facade.makeReactiveReader

  queryExecutors[readModel.name].mode = 'read'
})

config.viewModels.forEach(viewModel => {
  if (!viewModel.name && config.viewModels.length === 1) {
    viewModel.name = 'reduxinitial'
  } else if (!viewModel.name) {
    raiseError(message.viewModelMandatoryName, viewModel)
  } else if (queryExecutors[viewModel.name]) {
    raiseError(message.dublicateName, viewModel)
  }

  if (!viewModel.serializeState || !viewModel.deserializeState) {
    raiseError(message.viewModelSerializable, viewModel)
  }

  const facade = createFacade({
    model: createViewModel({
      projection: viewModel.projection,
      snapshotAdapter: viewModel.snapshotAdapter,
      snapshotBucketSize: viewModel.snapshotBucketSize,
      eventStore
    }),
    resolvers: {
      view: async (model, { jwtToken }) =>
        await viewModel.serializeState(model, jwtToken)
    }
  })

  queryExecutors[viewModel.name] = facade.executeQuery

  queryExecutors[viewModel.name].mode = 'view'
})

const executeCommand = commandHandler({
  eventStore,
  aggregates: config.aggregates
})

config.sagas.forEach(saga =>
  saga({
    subscribeByEventType: eventStore.subscribeByEventType,
    subscribeByAggregateId: eventStore.subscribeByAggregateId,
    queryExecutors,
    executeCommand
  })
)

app.use((req, res, next) => {
  req.jwtToken =
    req.cookies && req.cookies[config.jwtCookie.name]
      ? req.cookies[config.jwtCookie.name]
      : null

  req.resolve = {
    queryExecutors,
    executeCommand,
    eventStore
  }

  next()
})

const applyJwtValue = (value, res, url) => {
  const { name: cookieName, ...cookieOptions } = config.jwtCookie
  const authenticationToken = jwt.sign(value, jwtSecret)

  res.cookie(cookieName, authenticationToken, cookieOptions)

  res.redirect(url || getRootableUrl('/'))
}

const bindAuthMiddleware = (route, method, middleware, options) => {
  app[method](route, (req, res, next) =>
    middleware(passport, options, applyJwtValue, req, res, next)
  )
}

config.auth.strategies.forEach(strategy => {
  const options = strategy.options
  passport.use(strategy.init(options))
  const routes = options.routes
  Object.keys(routes).forEach(key => {
    const route = getRouteByName(key, routes)
    bindAuthMiddleware(route.path, route.method, strategy.middleware, options)
  })
})

app.use(passport.initialize())

try {
  if (config.extendExpress) {
    // eslint-disable-next-line no-console
    console.log(
      `${chalk.bgYellow.black('WARN')} ${chalk.magenta(
        'deprecated'
      )} do not use the \`extendExpress\` function in \`resolve.server.config.js\`.`
    )
    config.extendExpress(app)
  }
} catch (err) {}

app.post(getRootableUrl('/api/commands'), async (req, res) => {
  try {
    await executeCommand(req.body, req.jwtToken)
    res.status(200).send(message.commandSuccess)
  } catch (err) {
    res.status(500).end(`${message.commandFail}${err.message}`)
    // eslint-disable-next-line no-console
    console.log(err)
  }
})

const getSocketByClientId = socketId => {
  const socketIoNamespace = app.socketIo.sockets
  const socketClient = socketIoNamespace.connected[socketId]
  if (!socketClient) {
    throw new Error(message.badSocketIoClientId)
  }

  return socketClient
}

Object.keys(queryExecutors).forEach(modelName => {
  const executor = queryExecutors[modelName]
  const makeSubscriber = queryExecutors[modelName].makeSubscriber

  if (executor.mode === 'read') {
    const subscriptionProcesses = new Map()

    app.post(
      getRootableUrl(`/api/query/${modelName}/:resolverName`),
      bodyParser.urlencoded({ extended: false }),
      async (req, res) => {
        const serialId = Date.now()

        if (
          !req.body.variables ||
          !req.params.resolverName ||
          req.body.variables.constructor !== Object ||
          req.params.resolverName.constructor !== String
        ) {
          res
            .status(500)
            .end(`${message.readModelFail} Malformed read-model arguments`)

          // eslint-disable-next-line no-console
          console.log('Malformed read-model arguments')

          return
        }

        if (!req.body.isReactive) {
          try {
            const result = await executor(req.params.resolverName, {
              jwtToken: req.jwtToken,
              ...req.body.variables
            })
            res.status(200).send({
              serialId,
              result
            })
          } catch (err) {
            res.status(500).end(`${message.readModelFail}${err.message}`)

            // eslint-disable-next-line no-console
            console.log(err)
          }
          return
        }

        const subscriptionKey = `${req.body.socketId}:${
          req.params.resolverName
        }`
        if (subscriptionProcesses.get(subscriptionKey)) {
          res
            .status(500)
            .send(
              `Socket subscription ${modelName}:${subscriptionKey} already connected`
            )
          return
        }

        const subscriptionPromise = (async resolve => {
          await Promise.resolve()
          try {
            getSocketByClientId(req.body.socketId)

            const { result, forceStop } = await makeSubscriber(
              diff => {
                try {
                  const socketClient = getSocketByClientId(req.body.socketId)
                  socketClient.emit(
                    'event',
                    JSON.stringify({
                      type: '@@resolve/READMODEL_SUBSCRIPTION_DIFF',
                      readModelName: modelName,
                      resolverName: req.params.resolverName,
                      serialId,
                      diff
                    })
                  )
                } catch (sockErr) {
                  subscriptionProcesses.delete(subscriptionKey)
                  forceStop()
                }
              },
              req.params.resolverName,
              {
                jwtToken: req.jwtToken,
                ...req.body.variables
              }
            )

            res.status(200).send({
              timeToLive: READ_MODEL_SUBSCRIPTION_TIME_TO_LIVE,
              serialId,
              result
            })

            setTimeout(() => {
              subscriptionProcesses.delete(subscriptionKey)
              forceStop()
            }, READ_MODEL_SUBSCRIPTION_TIME_TO_LIVE)

            return forceStop
          } catch (err) {
            res.status(500).end(`${message.readModelFail}${err.message}`)

            subscriptionProcesses.delete(subscriptionKey)

            // eslint-disable-next-line no-console
            console.log(err)
          }
        })()

        subscriptionProcesses.set(subscriptionKey, subscriptionPromise)
      }
    )

    app.delete(
      getRootableUrl(`/api/query/${modelName}/:resolverName/:socketId`),
      async (req, res) => {
        try {
          const subscriptionKey = `${req.params.socketId}:${
            req.params.resolverName
          }`

          const forceStopPromise = subscriptionProcesses.get(subscriptionKey)
          if (forceStopPromise) {
            forceStopPromise.then(stop => stop())
          }

          subscriptionProcesses.delete(subscriptionKey)

          res.status(200).send('OK')
        } catch (err) {
          res.status(500).end(`${message.readModelFail}${err.message}`)
          // eslint-disable-next-line no-console
          console.log(err)
        }
      }
    )
  } else if (executor.mode === 'view') {
    app.get(getRootableUrl(`/api/query/${modelName}`), async (req, res) => {
      try {
        const aggregateIds = req.query.aggregateIds
        if (
          aggregateIds !== '*' &&
          (!Array.isArray(aggregateIds) || aggregateIds.length === 0)
        ) {
          throw new Error(message.viewModelOnlyOnDemand)
        }

        const result = await executor(
          'view',
          { jwtToken: req.jwtToken },
          { aggregateIds: req.query.aggregateIds }
        )

        res.status(200).json(result)
      } catch (err) {
        res.status(500).end(`${message.viewModelFail}${err.message}`)
        // eslint-disable-next-line no-console
        console.log(err)
      }
    })
  }
})

const staticMiddleware =
  process.env.NODE_ENV === 'production'
    ? express.static(path.join(process.cwd(), './dist/static'))
    : (req, res) => {
        const newurl = 'http://localhost:3001' + req.path
        request(newurl).pipe(res)
      }

app.use(getRootableUrl(STATIC_PATH), staticMiddleware)

app.get([getRootableUrl('/*'), getRootableUrl('/')], async (req, res) => {
  try {
    const state = await config.initialState(queryExecutors, {
      cookies: req.cookies,
      hostname: req.hostname,
      originalUrl: req.originalUrl,
      body: req.body,
      query: req.query,
      jwtToken: req.jwtToken
    })

    ssr(state, { req, res })
  } catch (err) {
    res.status(500).end(`${message.ssrError}${err.message}`)
    // eslint-disable-next-line no-console
    console.log(err)
  }
})

export default app
