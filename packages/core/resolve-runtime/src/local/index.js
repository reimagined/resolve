import 'source-map-support/register'
import debugLevels from 'debug-levels'

import initBroker from './init-broker'
import initExpress from './init-express'
import initSubscribeAdapter from './init-subscribe-adapter'
import initHMR from './init-hmr'
import prepareDomain from '../common/prepare-domain'
import startExpress from './start-express'
import emptyWorker from './empty-worker'

const log = debugLevels('resolve:resolve-runtime:local-entry')

const localEntry = async ({ assemblies, constants, domain, redux, routes }) => {
  try {
    const resolve = {
      instanceId: `${process.pid}${Math.floor(Math.random() * 100000)}`,
      aggregateActions: assemblies.aggregateActions,
      seedClientEnvs: assemblies.seedClientEnvs,
      assemblies,
      ...constants,
      ...domain,
      redux,
      routes
    }

    await prepareDomain(resolve)
    await initBroker(resolve)
    await initExpress(resolve)
    await initSubscribeAdapter(resolve)
    await initHMR(resolve)
    await startExpress(resolve)

    log.debug('Local entry point cold start success', resolve)

    return emptyWorker
  } catch (error) {
    log.error('Local entry point cold start failure', error)
  }
}

export default localEntry
