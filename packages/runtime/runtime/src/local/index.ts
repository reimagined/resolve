import 'source-map-support/register'
import crypto from 'crypto'
import { initDomain } from '@resolve-js/core'

import { getLog } from '../common/utils/get-log'
import { backgroundJob } from '../common/utils/background-job'
import { prepareDomain } from './prepare-domain'
import { lambdaGuard } from './lambda-guard'
import { performanceTracerFactory } from './performance-tracer-factory'
import { eventSubscriberNotifierFactory } from './event-subscriber-notifier-factory'

import { expressAppFactory } from './express-app-factory'
import { websocketServerFactory } from './websocket-server-factory'
import { startExpress } from './start-express'
import { uploaderFactory } from './uploader-factory'
import { schedulerFactory } from './scheduler-factory'
import { gatherEventListeners } from '../common/gather-event-listeners'
import { monitoringFactory } from './monitoring-factory'
import {
  createRuntime,
  RuntimeFactoryParameters,
} from '../common/create-runtime'

import type {
  Assemblies,
  Resolve,
  EventSubscriberNotification,
  BuildTimeConstants,
} from '../common/types'
import { createUserResolve } from '../common'

const DEFAULT_WORKER_LIFETIME = 4 * 60 * 1000

const log = getLog('local-entry')

type LocalEntryDependencies = {
  assemblies: Assemblies
  constants: BuildTimeConstants
  domain: Resolve['domain']
}

export const localEntry = async (dependencies: LocalEntryDependencies) => {
  try {
    process.env.RESOLVE_LOCAL_TRACE_ID = crypto
      .randomBytes(Math.ceil(32 / 2))
      .toString('hex')
      .slice(0, 32)

    const { assemblies, constants } = dependencies
    const domain = prepareDomain(dependencies.domain)
    const domainInterop = await initDomain(domain)

    const performanceTracer = await performanceTracerFactory()
    const monitoring = await monitoringFactory(performanceTracer)
    const notifyEventSubscriber = await eventSubscriberNotifierFactory()
    const host = constants.host ?? '0.0.0.0'
    const port = constants.port ?? '3000'

    const {
      eventstoreAdapter: eventStoreAdapterFactory,
      readModelConnectors: readModelConnectorsFactories,
    } = assemblies

    const endTime = Date.now() + DEFAULT_WORKER_LIFETIME
    const getVacantTimeInMillis = () => endTime - Date.now()

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
    })

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
          const runtime = await createRuntime(factoryParameters)
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
      seedClientEnvs: assemblies.seedClientEnvs,
      serverImports: assemblies.serverImports,
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
        upstream:
          domain.apiHandlers.findIndex(
            ({ method, path }) =>
              method === 'OPTIONS' && path === '/SKIP_COMMANDS'
          ) < 0,
        getEventSubscriberDestination: () =>
          `http://${host}:${port}/api/subscribers`,
        ensureQueue: async () => {
          return
        },
        deleteQueue: async () => {
          return
        },
        buildTimeConstants: constants,
      },
      factoryParameters
    )

    log.debug('Local entry point cold start success')

    return lambdaGuard
  } catch (error) {
    log.error('Local entry point cold start failure', error)
  }
}
