import debugLevels from '@resolve-js/debug-levels'

import handleApiGatewayEvent from './api-gateway-handler'
import handleDeployServiceEvent from './deploy-service-event-handler'
import handleSchedulerEvent from './scheduler-event-handler'
import initScheduler from './init-scheduler'
import initMonitoring from './init-monitoring'
import initSubscriber from './init-subscriber'
import { putDurationMetrics } from './metrics'
import initResolve from '../common/init-resolve'
import disposeResolve from '../common/dispose-resolve'
import handleWebsocketEvent from './websocket-event-handler'

const log = debugLevels('resolve:runtime:cloud-entry')

const GRACEFUL_WORKER_SHUTDOWN_TIME = 30 * 1000
const getVacantTimeInMillis = (lambdaContext) =>
  lambdaContext.getRemainingTimeInMillis() - GRACEFUL_WORKER_SHUTDOWN_TIME

const WORKER_HTTP_REQUEST_DURATION = 25 * 1000

let coldStart = true

const lambdaWorker = async (resolveBase, lambdaEvent, lambdaContext) => {
  log.debug('executing application lambda')
  log.verbose(JSON.stringify(lambdaEvent, null, 2))
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
        resolve,
        lambdaContext
      )

      log.verbose(`executorResult: ${JSON.stringify(executorResult)}`)

      return executorResult
    } else if (lambdaEvent.resolveSource === 'BuildEventSubscriber') {
      initSubscriber(resolveBase, lambdaContext)
      initScheduler(resolve)

      log.debug('initializing reSolve framework')
      await initResolve(resolve)
      log.debug('reSolve framework initialized')

      log.debug('identified event source: event-subscriber-direct')
      const { resolveSource, ...buildParameters } = lambdaEvent
      void resolveSource

      const executorResult = await resolve.eventSubscriber.build({
        ...buildParameters,
        coldStart,
      })

      log.verbose(`executorResult: ${JSON.stringify(executorResult)}`)

      return executorResult
    } else if (
      Array.isArray(lambdaEvent.Records) &&
      [
        ...new Set(
          lambdaEvent.Records.map((record) =>
            record != null ? record.eventSource : null
          )
        ),
      ].every((key) => key === 'aws:sqs')
    ) {
      initSubscriber(resolveBase, lambdaContext)
      initScheduler(resolve)

      log.debug('initializing reSolve framework')
      await initResolve(resolve)
      log.debug('reSolve framework initialized')
      const errors = []
      const records = lambdaEvent.Records.map((record) => {
        try {
          return JSON.parse(record.body)
        } catch (err) {
          errors.push(
            new Error(
              `Invalid record ${JSON.stringify(
                record
              )} parsing failed with error ${err}`
            )
          )
          return null
        }
      })
      let buildParameters = { coldStart, eventsWithCursors: [] }
      for (const record of records) {
        if (
          record == null ||
          record.eventSubscriber == null ||
          record.eventSubscriber.constructor !== String ||
          !(
            (record.event == null && record.event == null) ||
            (record.event != null &&
              record.event.constructor === Object &&
              record.cursor != null &&
              record.cursor.constructor === String)
          )
        ) {
          errors.push(new Error(`Malformed record ${JSON.stringify(record)}`))
          continue
        }
        const { eventSubscriber, event, cursor, ...notification } = record
        if (buildParameters.eventSubscriber == null) {
          buildParameters.eventSubscriber = eventSubscriber
        } else if (buildParameters.eventSubscriber !== eventSubscriber) {
          errors.push(
            new Error(
              `Multiple event subscribers ${buildParameters.eventSubscriber} and ${eventSubscriber} are not allowed in one window`
            )
          )
          continue
        }
        if (event != null && cursor != null) {
          buildParameters.eventsWithCursors.push({ event, cursor })
        }
        Object.assign(buildParameters, notification)
      }
      if (buildParameters.eventsWithCursors.length === 0) {
        buildParameters.eventsWithCursors = null
      }

      if (errors.length > 0) {
        const summaryError = new Error(
          errors.map(({ message }) => message).join('\n')
        )
        summaryError.stack = errors.map(({ stack }) => stack).join('\n')
        throw summaryError
      }

      const executorResult = await resolve.eventSubscriber.build(
        buildParameters
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

      if (
        lambdaEvent.requestStartTime !== undefined &&
        Number.isSafeInteger(lambdaEvent.requestStartTime)
      ) {
        resolve.getVacantTimeInMillis = () =>
          lambdaEvent.requestStartTime +
          WORKER_HTTP_REQUEST_DURATION -
          Date.now()
      }
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

    resolve.monitoring.group({ Part: 'Internal' }).error(error)

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
