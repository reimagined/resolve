import 'source-map-support/register'
import { initDomain } from '@resolve-js/core'
import http from 'http'
import https from 'https'

import { getLog } from '../common/utils/get-log'
import { backgroundJob } from '../common/utils/background-job'
import { prepareDomain } from './prepare-domain'
import { lambdaGuard } from './lambda-guard'
import { initPerformanceTracer } from './init-performance-tracer'

import initExpress from './init-express'
import initWebsockets from './init-websockets'
import startExpress from './start-express'
import initUploader from './init-uploader'
import initScheduler from './init-scheduler'
import gatherEventListeners from '../common/gather-event-listeners'
import initResolve from '../common/init-resolve'
import disposeResolve from '../common/dispose-resolve'

import type {
  Assemblies,
  ResolvePartial,
  Resolve,
  BuildParameters,
  BuildTimeConstants,
} from '../common/types'

const log = getLog('local-entry')

type LocalEntryDependencies = {
  assemblies: Assemblies
  constants: BuildTimeConstants
  domain: Resolve['domain']
}

const localEntry = async (dependencies: LocalEntryDependencies) => {
  try {
    const { assemblies, constants } = dependencies
    const domain = prepareDomain(dependencies.domain)
    const domainInterop = await initDomain(domain)

    const performanceTracer = await initPerformanceTracer()

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
      upstream:
        domain.apiHandlers.findIndex(
          ({ method, path }) =>
            method === 'OPTIONS' && path === '/SKIP_COMMANDS'
        ) < 0,
      https,
      http,
      getEventSubscriberDestination: () =>
        `http://0.0.0.0:${constants.port}/api/subscribers`,
      invokeBuildAsync: backgroundJob(async (parameters: BuildParameters) => {
        const currentResolve = Object.create(resolve)
        try {
          await initResolve(currentResolve)
          const result = await currentResolve.eventSubscriber.build(parameters)
          return result
        } finally {
          await disposeResolve(currentResolve)
        }
      }),
      ensureQueue: async () => {
        return
      },
      deleteQueue: async () => {
        return
      },
      performanceTracer,
    }

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

export default localEntry
