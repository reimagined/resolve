import 'source-map-support/register'
import debugLevels from '@resolve-js/debug-levels'
import { initDomain } from '@resolve-js/core'
import http from 'http'
import https from 'https'

import initPerformanceTracer from './init-performance-tracer'
import initExpress from './init-express'
import initWebsockets from './init-websockets'
import startExpress from './start-express'
import emptyWorker from './empty-worker'
import wrapTrie from '../common/wrap-trie'
import initUploader from './init-uploader'
import initScheduler from './init-scheduler'
import gatherEventListeners from '../common/gather-event-listeners'
import initResolve from '../common/init-resolve'
import disposeResolve from '../common/dispose-resolve'
import multiplexAsync from '../common/utils/multiplex-async'
import getRootBasedUrl from '../common/utils/get-root-based-url'

const log = debugLevels('resolve:runtime:local-entry')

const localEntry = async ({
  assemblies,
  constants,
  domain,
}: {
  assemblies: any
  constants: any
  domain: any
}) => {
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

    const resolve = {
      instanceId: `${process.pid}${Math.floor(Math.random() * 100000)}`,
      seedClientEnvs: assemblies.seedClientEnvs,
      serverImports: assemblies.serverImports,
      domain,
      ...constants,
      routesTrie: wrapTrie(domain.apiHandlers, constants.rootPath),
      assemblies,
      domainInterop,
      eventListeners: gatherEventListeners(domain, domainInterop),
      upstream:
        domain.apiHandlers.findIndex(
          ({ method, path }: { method: string; path: string }) =>
            method === 'OPTIONS' && path === '/SKIP_COMMANDS'
        ) < 0,
      https,
      http,
    }

    resolve.eventSubscriberDestination = `http://0.0.0.0:${constants.port}/api/subscribers`
    resolve.invokeBuildAsync = multiplexAsync.bind(
      null,
      async (parameters: any) => {
        const currentResolve = Object.create(resolve)
        try {
          await initResolve(currentResolve)
          return await currentResolve.eventSubscriber.build(parameters)
        } finally {
          await disposeResolve(currentResolve)
        }
      }
    )
    resolve.ensureQueue = async () => void 0
    resolve.deleteQueue = async () => void 0

    await initPerformanceTracer(resolve)
    await initExpress(resolve)
    Object.defineProperties(resolve, await initWebsockets(resolve))
    await initUploader(resolve)
    await initScheduler(resolve)
    await startExpress(resolve)

    log.debug('Local entry point cold start success')

    return emptyWorker
  } catch (error) {
    log.error('Local entry point cold start failure', error)
  }
}

export default localEntry
