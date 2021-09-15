import 'source-map-support/register'
import crypto from 'crypto'
import { initDomain } from '@resolve-js/core'

import { getLog } from '../common/utils/get-log'
import { backgroundJob } from '../common/utils/background-job'
import { prepareDomain } from './prepare-domain'
import { lambdaGuard } from './lambda-guard'
import { initPerformanceTracer } from './init-performance-tracer'
import { eventSubscriberNotifierFactory } from './event-subscriber-notifier-factory'

import initExpress from './init-express'
import initWebsockets from './init-websockets'
import startExpress from './start-express'
import initUploader from './init-uploader'
import initScheduler from './init-scheduler'
import { gatherEventListeners } from '../common/gather-event-listeners'
import {
  createRuntime,
  RuntimeFactoryParameters,
} from '../common/create-runtime'

import type {
  Assemblies,
  ResolvePartial,
  Resolve,
  EventSubscriberNotification,
  BuildTimeConstants,
} from '../common/types'

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

    const performanceTracer = await initPerformanceTracer()
    const notifyEventSubscriber = await eventSubscriberNotifierFactory()

    const {
      eventstoreAdapter: eventStoreAdapterFactory,
      readModelConnectors: readModelConnectorsFactories,
    } = assemblies

    const endTime = Date.now() + DEFAULT_WORKER_LIFETIME
    const getVacantTimeInMillis = () => endTime - Date.now()

    const factoryParameters: RuntimeFactoryParameters = {
      domain,
      domainInterop,
      performanceTracer,
      eventStoreAdapterFactory,
      readModelConnectorsFactories,
      getVacantTimeInMillis,
      eventSubscriberScope: constants.applicationName,
      notifyEventSubscriber,
      invokeBuildAsync: backgroundJob(
        async (parameters: EventSubscriberNotification) => {
          const runtime = await createRuntime(factoryParameters)
          try {
            const result = await runtime.eventSubscriber.build(parameters)
            return result
          } finally {
            await runtime.dispose()
          }
        }
      ),
      eventListeners: gatherEventListeners(domain, domainInterop),

    }

    const resolve: ResolvePartial = {
      instanceId: `${process.pid}${Math.floor(Math.random() * 100000)}`,
      seedClientEnvs: assemblies.seedClientEnvs,
      serverImports: assemblies.serverImports,
      domain,
      ...constants,
      assemblies,
      domainInterop,
      eventListeners: gatherEventListeners(domain, domainInterop),
      eventSubscriberScope: constants.applicationName,
      notifyEventSubscriber,
      upstream:
        domain.apiHandlers.findIndex(
          ({ method, path }) =>
            method === 'OPTIONS' && path === '/SKIP_COMMANDS'
        ) < 0,
      getEventSubscriberDestination: () =>
        `http://0.0.0.0:${constants.port}/api/subscribers`,
      invokeBuildAsync: backgroundJob(
        async (parameters: EventSubscriberNotification) => {
          const runtime = await createRuntime(resolve)
          try {
            const result = await runtime.eventSubscriber.build(parameters)
            return result
          } finally {
            await runtime.dispose()
          }
        }
      ),
      ensureQueue: async () => {
        return
      },
      deleteQueue: async () => {
        return
      },
      performanceTracer,
    }

    resolve.host = resolve.host ?? '0.0.0.0'
    resolve.getEventSubscriberDestination = () =>
      `http://${resolve.host}:${constants.port}/api/subscribers`

    await initExpress(resolve as Resolve)
    await initWebsockets(resolve as Resolve)
    await initUploader(resolve as Resolve)
    await initScheduler(resolve as Resolve)
    await startExpress(resolve as Resolve)

    log.debug('Local entry point cold start success')

    return lambdaGuard
  } catch (error) {
    log.error('Local entry point cold start failure', error)
  }
}
