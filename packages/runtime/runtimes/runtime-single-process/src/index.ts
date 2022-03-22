//import 'source-map-support/register'
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import interopRequireDefault from '@babel/runtime/helpers/interopRequireDefault'
import fs from 'fs'

import crypto from 'crypto'
import { initDomain } from '@resolve-js/core'
import {
  createCompositeMonitoringAdapter,
  gatherEventListeners,
  backgroundJob,
  createRuntime,
  getLog,
} from '@resolve-js/runtime-base'

import { prepareDomain } from './prepare-domain'
import { performanceTracerFactory } from './performance-tracer-factory'
import { eventSubscriberNotifierFactory } from './event-subscriber-notifier-factory'
import { expressAppFactory } from './express-app-factory'
import { websocketServerFactory } from './websocket-server-factory'
import { startExpress } from './start-express'
import { uploaderFactory } from './uploader-factory'
import { schedulerFactory } from './scheduler-factory'
import { cleanUpProcess } from './clean-up-process'

export * from './api-handlers'

import type {
  EventSubscriberNotification,
  RuntimeFactoryParameters,
  RuntimeAssemblies,
  RuntimeWorker,
} from '@resolve-js/runtime-base'

const INFINITE_WORKER_LIFETIME = 4 * 60 * 1000 // nothing special, just constant number

const log = getLog('dev-entry')

export type RuntimeOptions = {
  host?: string
  port?: string
  emulateWorkerLifetimeLimit?: number
}
type WorkerArguments = []

const makeVacantTimeEvaluator = (options: RuntimeOptions) => {
  const lifetimeLimit = options.emulateWorkerLifetimeLimit
  if (lifetimeLimit != null) {
    return (getRuntimeCreationTime: () => number) =>
      getRuntimeCreationTime() + lifetimeLimit - Date.now()
  }
  return () => INFINITE_WORKER_LIFETIME
}

const initExecutor = async (
  serverAssemblies: RuntimeAssemblies,
  options: Record<string, any>
): Promise<RuntimeWorker<WorkerArguments, void>> => {
  log.debug(`returning runtime worker (cold start)`)
  return async () => {
    try {
      log.debug(`initializing runtime`)
      log.debug(`options: ${options}`)

      process.env.RESOLVE_LOCAL_TRACE_ID = crypto
        .randomBytes(Math.ceil(32 / 2))
        .toString('hex')
        .slice(0, 32)

      const { constants, assemblies } = serverAssemblies
      const domain = prepareDomain(serverAssemblies.domain)
      const domainInterop = await initDomain(domain)

      const performanceTracer = await performanceTracerFactory()
      const notifyEventSubscriber = await eventSubscriberNotifierFactory()
      const host = options.host ?? '0.0.0.0'
      const port = options.port ?? '3000'

      const {
        eventstoreAdapter: eventStoreAdapterFactory,
        readModelConnectors: readModelConnectorsFactories,
        monitoringAdapters,
      } = assemblies

      const monitoring = createCompositeMonitoringAdapter(monitoringAdapters)
      const getVacantTimeInMillis = makeVacantTimeEvaluator(options)

      const uploaderData = await uploaderFactory({
        uploaderAdapterFactory: assemblies.uploadAdapter,
        host,
        port,
      })

      if (uploaderData != null) {
        Object.keys(uploaderData.env).forEach(
          (name) => (process.env[name] = uploaderData.env[name])
        )
      }

      const expressAppData = await expressAppFactory({
        rootPath: constants.rootPath,
        staticPath: constants.staticPath,
        distDir: constants.distDir,
        staticRoutes: constants.staticRoutes,
        apiHandlers: domain.apiHandlers,
      })

      const websocketServerData = await websocketServerFactory({
        server: expressAppData.server,
        eventStoreAdapterFactory,
        rootPath: constants.rootPath,
        applicationName: constants.applicationName,
      })
      const upstream =
        domain.apiHandlers.findIndex(
          ({ method, path }) =>
            method === 'OPTIONS' && path === '/SKIP_COMMANDS'
        ) < 0

      const factoryParameters: RuntimeFactoryParameters = {
        domain,
        domainInterop,
        performanceTracer,
        eventStoreAdapterFactory,
        readModelConnectorsFactories,
        monitoring,
        getVacantTimeInMillis,
        eventSubscriberScope: constants.applicationName,
        notifyEventSubscriber,
        invokeBuildAsync: async (
          parameters: EventSubscriberNotification,
          timeout?: number
        ) => {
          if (timeout != null && timeout > 0) {
            await new Promise((resolve) => setTimeout(resolve, timeout))
          }
          const job = backgroundJob(
            async (parameters: EventSubscriberNotification) => {
              const runtime = await createRuntime(factoryParameters)
              try {
                return await runtime.eventSubscriber.build(parameters)
              } finally {
                await runtime.dispose()
              }
            }
          )
          return await job(parameters)
        },
        eventListeners: gatherEventListeners(domain, domainInterop),
        uploader: uploaderData?.uploader ?? null,
        sendReactiveEvent: websocketServerData.sendReactiveEvent,
        getReactiveSubscription: websocketServerData.getReactiveSubscription,
        seedClientEnvs: assemblies.seedClientEnvs,
        serverImports: assemblies.serverImports,
        upstream,
        getEventSubscriberDestination: () =>
          `http://${host}:${port}/api/subscribers`,
        ensureQueue: async () => {
          return
        },
        deleteQueue: async () => {
          return
        },
      }

      // TODO: only remaining late binding, protected by guard
      factoryParameters.scheduler = await schedulerFactory(
        factoryParameters,
        domainInterop.sagaDomain.schedulerName
      )

      await startExpress(
        expressAppData,
        {
          host,
          port,
          buildTimeConstants: constants,
          upstream,
        },
        factoryParameters
      )

      process.on('SIGINT', cleanUpProcess.bind(null, factoryParameters))
    } catch (error) {
      log.error(error)
    }
  }
}

let maybeExecutorPromise: Promise<Function> | null = null
const main = async () => {
  try {
    if (maybeExecutorPromise == null) {
      const handlerPath = process.argv[2]
      if (handlerPath == null || !fs.existsSync(handlerPath)) {
        throw new Error(`Entry "${handlerPath}" is not provided`)
      }
      process.env.__RUNTIME_ENTRY_PATH = handlerPath

      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const serverAssemblies = interopRequireDefault(require(handlerPath))
        .default

      const serializedOptions = process.argv[3] ?? '{}'
      const options = JSON.parse(serializedOptions)

      maybeExecutorPromise = initExecutor(serverAssemblies, options)
    }
    const executor = await maybeExecutorPromise

    await executor()
  } catch (error) {
    log.error('Local executor fatal error: ', error)
    throw error
  }
}

main()
