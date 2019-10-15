import 'source-map-support/register'
import debugLevels from 'resolve-debug-levels'

import initBroker from './init-broker'
import initPerformanceTracer from './init-performance-tracer'
import initExpress from './init-express'
import initWebsockets from './init-websockets'
import startExpress from './start-express'
import emptyWorker from './empty-worker'
import wrapTrie from '../common/wrap-trie'

const log = debugLevels('resolve:resolve-runtime:local-entry')

const localEntry = async ({ assemblies, constants, domain }) => {
  try {
    const resolve = {
      instanceId: `${process.pid}${Math.floor(Math.random() * 100000)}`,
      seedClientEnvs: assemblies.seedClientEnvs,
      serverImports: assemblies.serverImports,
      ...domain,
      ...constants,
      routesTrie: wrapTrie(domain.apiHandlers, constants.rootPath),
      eventBroker: {},
      assemblies
    }

    await initPerformanceTracer(resolve)
    await initBroker(resolve)
    await initExpress(resolve)
    await initWebsockets(resolve)
    await startExpress(resolve)

    log.debug('Local entry point cold start success')

    return emptyWorker
  } catch (error) {
    log.error('Local entry point cold start failure', error)
  }
}

export default localEntry
