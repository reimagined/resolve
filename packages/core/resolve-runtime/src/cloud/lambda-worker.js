import debugLevels from 'resolve-debug-levels'

import handleApiGatewayEvent from './api-gateway-handler'
import handleDeployServiceEvent from './deploy-service-event-handler'
import handleEventBusEvent from './event-bus-event-handler'
import handleSchedulerEvent from './scheduler-event-handler'
import putMetrics from './metrics'
import initResolve from '../common/init-resolve'
import disposeResolve from '../common/dispose-resolve'

const log = debugLevels('resolve:resolve-runtime:cloud-entry')

let coldStart = true

const lambdaWorker = async (resolveBase, lambdaEvent, lambdaContext) => {
  log.debug('executing application lambda')
  log.verbose('incoming event', JSON.stringify(lambdaEvent, null, 2))
  lambdaContext.callbackWaitsForEmptyEventLoop = false

  const resolve = Object.create(resolveBase)
  resolve.getRemainingTimeInMillis = lambdaContext.getRemainingTimeInMillis.bind(
    lambdaContext
  )

  const lambdaRemainingTimeStart = lambdaContext.getRemainingTimeInMillis()

  try {
    log.debug('initializing reSolve framework')
    await initResolve(resolve)
    log.debug('reSolve framework initialized')

    if (lambdaEvent.resolveSource === 'DeployService') {
      log.debug('identified event source: deployment service')

      const executorResult = await handleDeployServiceEvent(
        lambdaEvent,
        resolve
      )

      log.verbose(`executorResult: ${JSON.stringify(executorResult)}`)

      return executorResult
    } else if (lambdaEvent.resolveSource === 'EventBus') {
      log.debug('identified event source: invoked by a step function')

      const executorResult = await handleEventBusEvent(lambdaEvent, resolve)

      log.verbose(`executorResult: ${JSON.stringify(executorResult)}`)

      return executorResult
    } else if (lambdaEvent.resolveSource === 'Scheduler') {
      log.debug('identified event source: cloud scheduler')

      const executorResult = await handleSchedulerEvent(lambdaEvent, resolve)

      log.verbose(`executorResult: ${JSON.stringify(executorResult)}`)

      return executorResult
    } else if (lambdaEvent.headers != null && lambdaEvent.httpMethod != null) {
      log.debug('identified event source: API gateway')
      log.verbose(
        JSON.stringify(lambdaEvent.httpMethod, null, 2),
        JSON.stringify(lambdaEvent.headers, null, 2)
      )

      const executorResult = await handleApiGatewayEvent(
        lambdaEvent,
        lambdaContext,
        resolve
      )

      log.verbose(`executorResult: ${JSON.stringify(executorResult)}`)

      return executorResult
    } else {
      throw new Error(
        `abnormal lambda execution on event ${JSON.stringify(lambdaEvent)}`
      )
    }
  } catch (error) {
    log.error('top-level event handler execution error!')

    if (error instanceof Error) {
      log.error('error', error.message)
      log.error('error', error.stack)
    } else {
      log.error(JSON.stringify(error))
    }

    return error
  } finally {
    await disposeResolve(resolve)
    if (process.env.RESOLVE_PERFORMANCE_MONITORING) {
      await putMetrics(
        lambdaEvent,
        lambdaContext,
        coldStart,
        lambdaRemainingTimeStart
      )
    }
    coldStart = false
    log.debug('reSolve framework was disposed')
  }
}

export default lambdaWorker
