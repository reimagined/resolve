import 'source-map-support/register'
import { initDomain } from '@resolve-js/core'
import type { DomainMeta } from '@resolve-js/core'
import http from 'http'
import https from 'https'

import { getLog } from '../common/utils/get-log'
import initPerformanceTracer from './init-performance-tracer'
import initExpress from './init-express'
import initWebsockets from './init-websockets'
import startExpress from './start-express'
import emptyWorker from './empty-worker'
import initUploader from './init-uploader'
import initScheduler from './init-scheduler'
import gatherEventListeners from '../common/gather-event-listeners'
import initResolve from '../common/init-resolve'
import disposeResolve from '../common/dispose-resolve'
import { backgroundJob } from '../common/utils/background-job'
import getRootBasedUrl from '../common/utils/get-root-based-url'

import type {
  Assemblies,
  ResolvePartial,
  Resolve,
  BuildParameters,
} from '../common/types'

const log = getLog('local-entry')

type LocalEntryDependencies = {
  assemblies: Assemblies
  constants: Record<string, any>
  domain: Resolve['domain']
}

const localEntry = async ({
  assemblies,
  constants,
  domain,
}: LocalEntryDependencies) => {
  try {
    domain.apiHandlers.push({
      path: '/api/subscribers/:eventSubscriber',
      method: 'GET',
      handler: async (req: any, res: any) => {
        try {
          const baseQueryUrl = getRootBasedUrl(
            req.resolve.rootPath,
            '/api/subscribers/'
          )

          const eventSubscriber = req.path.substring(baseQueryUrl.length)
          await req.resolve.eventSubscriber.build({ eventSubscriber })
          await res.end('ok')
        } catch (error) {
          // eslint-disable-next-line no-console
          console.error(error)
          await res.end(error)
        }
      },
    })

    const domainInterop = await initDomain(domain)

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
          ({ method, path }: any) =>
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
    }

    await initPerformanceTracer(resolve)
    await initExpress(resolve as Resolve)
    await initWebsockets(resolve as Resolve)
    await initUploader(resolve as Resolve)
    await initScheduler(resolve as Resolve)
    await startExpress(resolve as Resolve)

    log.debug('Local entry point cold start success')

    return emptyWorker
  } catch (error) {
    log.error('Local entry point cold start failure', error)
  }
}

export default localEntry
