import 'source-map-support/register'

import debugLevels from 'resolve-debug-levels'
import { createActions } from 'resolve-redux'

import initAwsClients from './init-aws-clients'
import prepareDomain from '../common/prepare-domain'
import initBroker from './init-broker'
import initPerformanceTracer from './init-performance-tracer'
import lambdaWorker from './lambda-worker'

const log = debugLevels('resolve:resolve-runtime:cloud-entry')

const index = async ({ assemblies, constants, domain, redux, routes }) => {
  let subSegment = null

  log.debug(`starting lambda 'cold start'`)
  try {
    log.debug('configuring reSolve framework')
    const resolve = {
      seedClientEnvs: assemblies.seedClientEnvs,
      assemblies,
      ...constants,
      ...domain,
      redux,
      routes
    }

    log.debug('preparing performance tracer')
    await initPerformanceTracer(resolve)

    const segment = resolve.performanceTracer.getSegment()
    subSegment = segment.addNewSubsegment('initResolve')

    resolve.aggregateActions = {}
    for (const aggregate of domain.aggregates) {
      Object.assign(resolve.aggregateActions, createActions(aggregate))
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
    subSegment.addError(error)
  } finally {
    if (subSegment != null) {
      subSegment.close()
    }
  }
}

export default index
