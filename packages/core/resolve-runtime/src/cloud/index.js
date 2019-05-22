import 'source-map-support/register'

import debugLevels from 'debug-levels'
import initAwsClients from './init-aws-clients'
import prepareDomain from '../common/prepare-domain'
import initBroker from './init-broker'
import lambdaWorker from './lambda-worker'

const log = debugLevels('resolve:resolve-runtime:cloud-entry')

const index = async ({ assemblies, constants, domain, redux, routes }) => {
  log.debug(`starting lambda 'cold start'`)
  try {
    log.debug('configuring reSolve framework')
    const resolve = {
      aggregateActions: assemblies.aggregateActions,
      seedClientEnvs: assemblies.seedClientEnvs,
      assemblies,
      ...constants,
      ...domain,
      redux,
      routes
    }

    log.debug('preparing aws clients')
    await initAwsClients(resolve)

    log.debug('preparing domain')
    await prepareDomain(resolve)

    log.debug('preparing event broker')
    await initBroker(resolve)

    log.debug(`lambda 'cold start' succeeded`)

    return lambdaWorker.bind(null, resolve)
  } catch (error) {
    log.error(`lambda 'cold start' failure`, error)
  }
}

export default index
