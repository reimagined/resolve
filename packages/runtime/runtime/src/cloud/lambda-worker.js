import debugLevels from '@resolve-js/debug-levels'
import { invokeFunction } from 'resolve-cloud-common/lambda'

import handleApiGatewayEvent from './api-gateway-handler'
import handleDeployServiceEvent from './deploy-service-event-handler'
import handleSchedulerEvent from './scheduler-event-handler'
import initScheduler from './init-scheduler'
import initMonitoring from './init-monitoring'
import { putDurationMetrics } from './metrics'
import initResolve from '../common/init-resolve'
import disposeResolve from '../common/dispose-resolve'
import handleWebsocketEvent from './websocket-event-handler'

const log = debugLevels('resolve:runtime:cloud-entry')

const GRACEFUL_WORKER_SHUTDOWN_TIME = 30 * 1000
const getVacantTimeInMillis = (lambdaContext) =>
  lambdaContext.getRemainingTimeInMillis() - GRACEFUL_WORKER_SHUTDOWN_TIME

const EVENT_SUBSCRIBER_DIRECT = 'EventSubscriberDirect'

let coldStart = true

const initSubscriber = (resolve, lambdaContext) => {
  resolve.eventSubscriberDestination = lambdaContext.invokedFunctionArn
  resolve.subscriptionsCredentials = {
    applicationLambdaArn: lambdaContext.invokedFunctionArn,
  }

  resolve.invokeEventSubscriberAsync = async (
    eventSubscriber,
    method,
    parameters
  ) => {
    await invokeFunction({
      FunctionName: lambdaContext.invokedFunctionArn,
      InvocationType: 'Event',
      Region: process.env.AWS_REGION,
      Payload: {
        resolveSource: EVENT_SUBSCRIBER_DIRECT,
        method,
        payload: {
          eventSubscriber,
          ...parameters,
        },
      },
    })
  }
}

const lambdaWorker = async (resolveBase, lambdaEvent, lambdaContext) => {
  log.debug('executing application lambda')
  log.verbose('incoming event', JSON.stringify(lambdaEvent, null, 2))
  lambdaContext.callbackWaitsForEmptyEventLoop = false

  initMonitoring(resolveBase)

  const resolve = Object.create(resolveBase)
  resolve.getVacantTimeInMillis = getVacantTimeInMillis.bind(
    null,
    lambdaContext
  )

  const lambdaRemainingTimeStart = lambdaContext.getRemainingTimeInMillis()

  try {
    if (lambdaEvent.resolveSource === 'DeployService') {
      initSubscriber(resolveBase, lambdaContext)
      initScheduler(resolve)

      log.debug('initializing reSolve framework')
      await initResolve(resolve)
      log.debug('reSolve framework initialized')

      log.debug('identified event source: deployment service')

      const executorResult = await handleDeployServiceEvent(
        lambdaEvent,
        resolve
      )

      log.verbose(`executorResult: ${JSON.stringify(executorResult)}`)

      return executorResult
    } else if (lambdaEvent.resolveSource === EVENT_SUBSCRIBER_DIRECT) {
      initSubscriber(resolveBase, lambdaContext)
      initScheduler(resolve)

      log.debug('initializing reSolve framework')
      await initResolve(resolve)
      log.debug('reSolve framework initialized')

      log.debug('identified event source: event-subscriber-direct')
      const { method, payload } = lambdaEvent

      const actualPayload =
        method === 'build' ? { ...payload, coldStart } : payload

      const executorResult = await resolve.eventSubscriber[method](
        actualPayload
      )

      log.verbose(`executorResult: ${JSON.stringify(executorResult)}`)

      return executorResult
    } else if (lambdaEvent.resolveSource === 'Scheduler') {
      initSubscriber(resolveBase, lambdaContext)
      initScheduler(resolve)

      log.debug('initializing reSolve framework')
      await initResolve(resolve)
      log.debug('reSolve framework initialized')

      log.debug('identified event source: cloud scheduler')

      const executorResult = await handleSchedulerEvent(lambdaEvent, resolve)

      log.verbose(`executorResult: ${JSON.stringify(executorResult)}`)

      return executorResult
    } else if (lambdaEvent.resolveSource === 'Websocket') {
      initSubscriber(resolveBase, lambdaContext)
      initScheduler(resolve)

      log.debug('initializing reSolve framework')
      await initResolve(resolve)
      log.debug('reSolve framework initialized')

      log.debug('identified event source: websocket')

      const executorResult = await handleWebsocketEvent(lambdaEvent, resolve)

      log.verbose(`executorResult: ${JSON.stringify(executorResult)}`)

      return executorResult
    } else if (lambdaEvent.headers != null && lambdaEvent.httpMethod != null) {
      initSubscriber(resolveBase, lambdaContext)
      initScheduler(resolve)

      log.debug('initializing reSolve framework')
      await initResolve(resolve)
      log.debug('reSolve framework initialized')

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

    resolve.monitoring.error('internal', error)

    if (error instanceof Error) {
      log.error('error', error.message)
      log.error('error', error.stack)
    } else {
      log.error(JSON.stringify(error))
    }

    throw error
  } finally {
    await disposeResolve(resolve)

    if (process.env.RESOLVE_PERFORMANCE_MONITORING) {
      await putDurationMetrics(
        lambdaEvent,
        lambdaContext,
        coldStart,
        lambdaRemainingTimeStart
      )
    }

    coldStart = false
    log.debug('reSolve framework was disposed. publishing metrics')

    await resolve.monitoring.publish()

    log.debug(`metrics published`)
  }
}

export default lambdaWorker
