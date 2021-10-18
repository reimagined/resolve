import 'source-map-support/register'
import partial from 'lodash.partial'
import crypto from 'crypto'
import { initDomain } from '@resolve-js/core'
import {
  getLog,
  backgroundJob,
  gatherEventListeners,
  createRuntime,
} from '@resolve-js/runtime-base'
import { prepareDomain } from './prepare-domain'
import { performanceTracerFactory } from './performance-tracer-factory'
import { eventSubscriberNotifierFactory } from './event-subscriber-notifier-factory'
import { expressAppFactory } from './express-app-factory'
import { websocketServerFactory } from './websocket-server-factory'
import { startExpress } from './start-express'
import { uploaderFactory } from './uploader-factory'
import { schedulerFactory } from './scheduler-factory'
import { monitoringFactory } from './monitoring-factory'

import type {
  EventSubscriberNotification,
  RuntimeFactoryParameters,
  RuntimeModuleFactory,
  RuntimeEntryContext,
  RuntimeWorker,
} from '@resolve-js/runtime-base'

const DEFAULT_WORKER_LIFETIME = 4 * 60 * 1000

const log = getLog('dev-entry')

type RuntimeOptions = {
  host?: string
  port?: string
  emulateWorkerLifetimeLimit?: number
}
type WorkerArguments = []

const entry = async (
  options: RuntimeOptions,
  context: RuntimeEntryContext
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

      const { assemblies, constants } = context
      const domain = prepareDomain(context.domain)
      const domainInterop = await initDomain(domain)

      const performanceTracer = await performanceTracerFactory()
      const monitoring = await monitoringFactory(performanceTracer)
      const notifyEventSubscriber = await eventSubscriberNotifierFactory()
      const host = options.host ?? '0.0.0.0'
      const port = options.port ?? '3000'

      const {
        eventstoreAdapter: eventStoreAdapterFactory,
        readModelConnectors: readModelConnectorsFactories,
      } = assemblies

      const getVacantTimeInMillis = (getRuntimeCreationTime: () => number) =>
        getRuntimeCreationTime() + DEFAULT_WORKER_LIFETIME - Date.now()

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
        monitoring,
        eventStoreAdapterFactory,
        readModelConnectorsFactories,
        getVacantTimeInMillis,
        eventSubscriberScope: constants.applicationName,
        notifyEventSubscriber,
        invokeBuildAsync: backgroundJob(
          async (parameters: EventSubscriberNotification) => {
            const endTime = Date.now() + DEFAULT_WORKER_LIFETIME
            const getVacantTimeInMillis = () => endTime - Date.now()

            const runtime = await createRuntime({
              ...factoryParameters,
              getVacantTimeInMillis,
            })
            try {
              return await runtime.eventSubscriber.build(parameters)
            } finally {
              await runtime.dispose()
            }
          }
        ),
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
    } catch (error) {
      log.error(error)
    }
  }
}

const factory: RuntimeModuleFactory<RuntimeOptions, WorkerArguments, void> = (
  options: RuntimeOptions
) => ({
  entry: partial(entry, options),
  execMode: 'immediate',
})

export * from './api-handlers'
export default factory
