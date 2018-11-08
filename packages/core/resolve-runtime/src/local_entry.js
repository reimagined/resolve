import 'source-map-support/register'
import { Server } from 'http'
import express from 'express'
import path from 'path'
import wrapApiHandler from 'resolve-api-handler-express'
import createCommandExecutor from 'resolve-command'
import createEventStore from 'resolve-es'
import createQueryExecutor from 'resolve-query'
import createSocketServer from 'socket.io'
import uuid from 'uuid/v4'

import createPubsubManager from './utils/create_pubsub_manager'
import getRootBasedUrl from './utils/get_root_based_url'
import println from './utils/println'

import startExpressServer from './utils/start_express_server'
import sagaRunnerExpress from './utils/saga_runner_express'

import mainHandler from './handlers/main_handler'

const initEventStore = async (
  { storageAdapter: createStorageAdapter, busAdapter: createBusAdapter },
  resolve
) => {
  Object.assign(resolve, {
    eventStore: createEventStore({
      storage: createStorageAdapter(),
      bus: createBusAdapter()
    })
  })
}

const initExpress = async resolve => {
  const app = express()
  const server = new Server(app)

  Object.defineProperties(resolve, {
    app: { value: app },
    server: { value: server }
  })
}

const initSubscribeAdapter = async (
  { subscribeAdapter: createSubscribeAdapter },
  resolve
) => {
  const pubsubManager = createPubsubManager()

  const subscribeAdapter = createSubscribeAdapter({
    pubsubManager,
    server: resolve.server,
    getRootBasedUrl: getRootBasedUrl.bind(null, resolve.rootPath),
    qos: 1,
    appId: 'resolve'
  })

  await subscribeAdapter.init()

  Object.defineProperties(resolve, {
    subscribeAdapter: { value: subscribeAdapter },
    pubsubManager: { value: pubsubManager }
  })
}

const initHMR = async resolve => {
  const HMR_ID = uuid()

  const HMRSocketHandler = socket => {
    socket.emit('hotModuleReload', HMR_ID)
  }

  const HMRSocketServer = createSocketServer(resolve.server, {
    path: getRootBasedUrl(resolve.rootPath, '/api/hmr/'),
    serveClient: false
  })

  HMRSocketServer.on('connection', HMRSocketHandler)
}

const emptyWorker = async () => {
  throw new Error(
    'Guard exception: worker should not be invoked on non-cloud environment'
  )
}

const initDomain = async (
  { snapshotAdapter: createSnapshotAdapter },
  resolve
) => {
  const { eventStore, aggregates, readModels, viewModels } = resolve
  const snapshotAdapter = createSnapshotAdapter()

  const executeCommand = createCommandExecutor({
    eventStore,
    aggregates,
    snapshotAdapter
  })

  const executeQuery = createQueryExecutor({
    eventStore,
    viewModels,
    readModels,
    snapshotAdapter
  })

  Object.assign(resolve, {
    executeCommand,
    executeQuery
  })

  Object.defineProperty(resolve, 'snapshotAdapter', {
    value: snapshotAdapter
  })
}

const initEventLoop = async resolve => {
  const executors = Array.from(resolve.executeQuery.getExecutors().values())

  const unsubscribe = await resolve.eventStore.loadEvents(
    { skipStorage: true },
    async event => {
      await resolve.pubsubManager.dispatch({
        topicName: event.type,
        topicId: event.aggregateId,
        event
      })

      // In multi-instance mode application developer should give a guarantee
      // that every read/view-model had been updated only from singular instance
      // Updating read/view-model from multiple threads is not supported
      const applicationPromises = []
      for (const executor of executors) {
        applicationPromises.push(executor.updateByEvents([event]))
      }
      await Promise.all(applicationPromises)
    }
  )

  Object.defineProperty(resolve, 'unsubscribe', {
    value: unsubscribe
  })
}

const localEntry = async ({ assemblies, constants, domain, redux, routes }) => {
  try {
    const resolve = { ...constants, ...domain, redux, routes }
    resolve.aggregateActions = assemblies.aggregateActions
    await initEventStore(assemblies, resolve)
    await initExpress(resolve)
    await initSubscribeAdapter(assemblies, resolve)
    await initHMR(resolve)
    await initDomain(assemblies, resolve)
    await initEventLoop(resolve)

    const getCustomParameters = async () => ({ resolve })
    const executor = wrapApiHandler(mainHandler, getCustomParameters)

    resolve.app.use(
      getRootBasedUrl(resolve.rootPath, `/${resolve.staticPath}`),
      express.static(path.join(process.cwd(), resolve.distDir, './client'))
    )

    resolve.app.use(executor)

    await sagaRunnerExpress(resolve, assemblies.sagas)
    await startExpressServer(resolve)

    return emptyWorker
  } catch (error) {
    println(error)
  }
}

export default localEntry
