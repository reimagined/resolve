import debugLevels from '@resolve-js/debug-levels'
import { invokeFunction } from 'resolve-cloud-common/lambda'

import handleApiGatewayEvent from './api-gateway-handler'
import handleDeployServiceEvent from './deploy-service-event-handler'
import handleSchedulerEvent from './scheduler-event-handler'
import initScheduler from './init-scheduler'
import initMonitoring from './init-monitoring'
import { putDurationMetrics, putInternalError } from './metrics'
import initResolve from '../common/init-resolve'
import disposeResolve from '../common/dispose-resolve'
import handleWebsocketEvent from './websocket-event-handler'

const log = debugLevels('resolve:runtime:cloud-entry')

const GRACEFUL_WORKER_SHUTDOWN_TIME = 30 * 1000
const getVacantTimeInMillis = (lambdaContext) =>
  lambdaContext.getRemainingTimeInMillis() - GRACEFUL_WORKER_SHUTDOWN_TIME

const EVENT_SUBSCRIBER_DIRECT = 'EventSubscriberDirect'

let coldStart = true

const lambdaWorker = async (resolveBase, lambdaEvent, lambdaContext) => {
  log.debug('executing application lambda')
  log.verbose('incoming event', JSON.stringify(lambdaEvent, null, 2))
  lambdaContext.callbackWaitsForEmptyEventLoop = false

  resolveBase.eventSubscriberDestination = lambdaContext.invokedFunctionArn
  resolveBase.subscriptionsCredentials = {
    applicationLambdaArn: lambdaContext.invokedFunctionArn,
  }

  resolveBase.invokeEventSubscriberAsync = async (
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

  initMonitoring(resolveBase)

  const resolve = Object.create(resolveBase)
  resolve.getVacantTimeInMillis = getVacantTimeInMillis.bind(
    null,
    lambdaContext
  )
  await initScheduler(resolve)

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
    } else if (lambdaEvent.resolveSource === EVENT_SUBSCRIBER_DIRECT) {
      log.debug('identified event source: event-subscriber-direct')
      const { method, payload } = lambdaEvent
      const executorResult = await resolve.eventSubscriber[method](payload)

      log.verbose(`executorResult: ${JSON.stringify(executorResult)}`)

      return executorResult
    } else if (lambdaEvent.resolveSource === 'Scheduler') {
      log.debug('identified event source: cloud scheduler')

      const executorResult = await handleSchedulerEvent(lambdaEvent, resolve)

      log.verbose(`executorResult: ${JSON.stringify(executorResult)}`)

      return executorResult
    } else if (lambdaEvent.resolveSource === 'Websocket') {
      log.debug('identified event source: websocket')

      const executorResult = await handleWebsocketEvent(lambdaEvent, resolve)

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

    await putInternalError(error)

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
    log.debug('reSolve framework was disposed')
  }
}

export default lambdaWorker
