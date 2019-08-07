import 'source-map-support/register'
import debugLevels from 'resolve-debug-levels'
import { createActions } from 'resolve-redux'

import initBroker from './init-broker'
import initPerformanceTracer from './init-performance-tracer'
import initExpress from './init-express'
import initWebsockets from './init-websockets'
import prepareDomain from '../common/prepare-domain'
import startExpress from './start-express'
import emptyWorker from './empty-worker'

const log = debugLevels('resolve:resolve-runtime:local-entry')

const localEntry = async ({ assemblies, constants, domain, redux, routes }) => {
  try {
    const resolve = {
      instanceId: `${process.pid}${Math.floor(Math.random() * 100000)}`,
      seedClientEnvs: assemblies.seedClientEnvs,
      assemblies,
      ...constants,
      ...domain,
      redux,
      routes
    }

    await initPerformanceTracer(resolve)

    resolve.aggregateActions = {}
    for (const aggregate of domain.aggregates) {
      Object.assign(resolve.aggregateActions, createActions(aggregate))
    }

    await prepareDomain(resolve)
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
