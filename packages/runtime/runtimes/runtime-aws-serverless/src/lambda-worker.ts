import {
  getLog,
  createRuntime,
  RuntimeAssemblies,
  RuntimeWorker,
  createCompositeMonitoringAdapter,
  gatherEventListeners,
  wrapTrie,
} from '@resolve-js/runtime-base'

import { schedulerFactory } from './scheduler-factory'
import { eventSubscriberNotifierFactory } from './event-subscriber-notifier-factory'
import { putDurationMetrics } from './metrics'
import { handleWebsocketEvent } from './websocket-event-handler'
import { handleApiGatewayEvent } from './api-gateway-handler'
import { handleCloudServiceEvent } from './cloud-service-event-handler'
import { handleSchedulerEvent } from './scheduler-event-handler'
import partial from 'lodash.partial'

import type { EventPointer } from '@resolve-js/core'
import type {
  Runtime,
  RuntimeFactoryParameters,
} from '@resolve-js/runtime-base'
import type {
  CloudServiceLambdaEvent,
  EventSubscriberInterface,
  LambdaColdStartContext,
  LambdaContext,
  LambdaEventRecord,
  LambdaEvent,
  WorkerResult,
} from './types'
import { WorkerArguments } from './types'
import { prepareAssemblies } from './prepare-assemblies'
import { initDomain, PerformanceSubsegment } from '@resolve-js/core'
import { performanceTracerFactory } from './performance-tracer-factory'
import { uploaderFactory } from './uploader-factory'
import { getReactiveSubscriptionFactory } from './get-reactive-subscription-factory'
import { getDeploymentId } from './utils'
import { sendReactiveEvent } from './send-reactive-event'

const log = getLog('lambda-worker')

const logRuntimeCase = (caseName: string) =>
  log.log(`Runtime execution: ${caseName}`)

const GRACEFUL_WORKER_SHUTDOWN_TIME = 30 * 1000
const getLambdaVacantTime = (lambdaContext: any) =>
  lambdaContext.getRemainingTimeInMillis() - GRACEFUL_WORKER_SHUTDOWN_TIME

const WORKER_HTTP_REQUEST_DURATION = 25 * 1000

let coldStart = true

const createCloudRuntime = async (
  coldStartContext: LambdaColdStartContext,
  lambdaContext: LambdaContext,
  subscriberInterface: EventSubscriberInterface,
  overrideFactoryParams: Partial<RuntimeFactoryParameters> = {}
) => {
  const getVacantTimeInMillis = partial(
    getLambdaVacantTime,
    lambdaContext,
    () => void 0
  )
  const {
    eventstoreAdapter: eventStoreAdapterFactory,
    readModelConnectors: readModelConnectorsFactories,
  } = coldStartContext.assemblies

  const runtimeParams: RuntimeFactoryParameters = {
    ...coldStartContext,
    eventStoreAdapterFactory,
    readModelConnectorsFactories,
    getVacantTimeInMillis,
    notifyEventSubscriber: subscriberInterface.notifyEventSubscriber,
    invokeBuildAsync: subscriberInterface.invokeBuildAsync,
    ensureQueue: subscriberInterface.ensureQueue,
    deleteQueue: subscriberInterface.deleteQueue,
    getEventSubscriberDestination:
      subscriberInterface.getEventSubscriberDestination,
    ...overrideFactoryParams,
  }

  const runtime = await createRuntime(runtimeParams)
  const scheduler = await schedulerFactory(
    runtime,
    coldStartContext.domainInterop.sagaDomain.schedulerName
  )
  // TODO: only remaining late binding, protected by guard
  log.debug(`scheduler late binding`)
  runtimeParams.scheduler = scheduler

  return {
    runtime,
    scheduler,
    getVacantTimeInMillis,
  }
}

export const lambdaWorker = async (
  coldStartContext: LambdaColdStartContext,
  lambdaEvent: CloudServiceLambdaEvent | LambdaEvent,
  lambdaContext: LambdaContext
): Promise<WorkerResult> => {
  log.debug('executing application lambda')
  log.verbose(JSON.stringify(lambdaEvent, null, 2))
  lambdaContext.callbackWaitsForEmptyEventLoop = false

  const lambdaRemainingTimeStart = lambdaContext.getRemainingTimeInMillis()
  const subscriberInterface = await eventSubscriberNotifierFactory({
    eventSubscriberScope: coldStartContext.eventSubscriberScope,
    lambdaContext,
  })

  const makeRuntime = partial(
    createCloudRuntime,
    coldStartContext,
    lambdaContext,
    subscriberInterface
  )

  let runtime: Runtime | null = null

  // TODO: too complex

  try {
    if (lambdaEvent.resolveSource === 'DeployService') {
      logRuntimeCase('DeployService')
      void ({ runtime } = await makeRuntime({}))

      const executorResult = await handleCloudServiceEvent(
        lambdaEvent,
        runtime,
        {
          domain: coldStartContext.domain,
          domainInterop: coldStartContext.domainInterop,
          eventListeners: coldStartContext.eventListeners,
          eventSubscriberScope: coldStartContext.eventSubscriberScope,
          deleteQueue: subscriberInterface.deleteQueue,
          ensureQueue: subscriberInterface.ensureQueue,
          getEventSubscriberDestination:
            subscriberInterface.getEventSubscriberDestination,
          upstream: true,
          performanceTracer: coldStartContext.performanceTracer,
        }
      )

      log.verbose(`executorResult: ${JSON.stringify(executorResult)}`)

      return executorResult
    } else if (lambdaEvent.resolveSource === 'BuildEventSubscriber') {
      logRuntimeCase('BuildEventSubscriber')
      void ({ runtime } = await makeRuntime({}))

      const { resolveSource, eventSubscriber, ...buildParameters } = lambdaEvent
      void resolveSource

      // TODO ???
      const executorResult = await runtime.eventSubscriber.build({
        ...buildParameters,
        eventSubscriber,
        coldStart,
      } as any)

      log.verbose(`executorResult: ${JSON.stringify(executorResult)}`)

      // TODO ???
      return executorResult as any
    } else if (
      Array.isArray(lambdaEvent.Records) &&
      [
        ...new Set(
          lambdaEvent.Records.map((record: LambdaEventRecord) =>
            record != null ? record.eventSource : null
          )
        ),
      ].every((key) => key === 'aws:sqs')
    ) {
      logRuntimeCase('SQS')
      const errors = []
      const records = lambdaEvent.Records.map((record: LambdaEventRecord) => {
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

      void ({ runtime } = await makeRuntime({}))

      type BuildParameters = {
        coldStart: boolean
        eventsWithCursors: EventPointer[] | null
        eventSubscriber?: string
      }

      let buildParameters: BuildParameters = {
        coldStart,
        eventsWithCursors: [],
      }
      for (const record of records) {
        if (
          record == null ||
          record.eventSubscriber == null ||
          record.eventSubscriber.constructor !== String ||
          !(
            (record.event == null && record.cursor == null) ||
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
          void (buildParameters.eventsWithCursors as EventPointer[]).push({
            event,
            cursor,
          })
        }
        Object.assign(buildParameters, notification)
      }
      if ((buildParameters.eventsWithCursors as EventPointer[]).length === 0) {
        buildParameters.eventsWithCursors = null
      }

      if (errors.length > 0) {
        const summaryError = new Error(
          errors.map(({ message }) => message).join('\n')
        )
        summaryError.stack = errors.map(({ stack }) => stack).join('\n')
        throw summaryError
      }

      // TODO ???
      const executorResult = await runtime.eventSubscriber.build(
        buildParameters as any
      )

      log.verbose(`executorResult: ${JSON.stringify(executorResult)}`)

      // TODO ???
      return executorResult as any
    } else if (lambdaEvent.resolveSource === 'Scheduler') {
      logRuntimeCase('Scheduler')

      const data = await makeRuntime({})

      const executorResult = await handleSchedulerEvent(
        lambdaEvent,
        data.scheduler
      )

      log.verbose(`executorResult: ${JSON.stringify(executorResult)}`)

      return executorResult
    } else if (lambdaEvent.resolveSource === 'Websocket') {
      logRuntimeCase('Websocket')

      void ({ runtime } = await makeRuntime({}))

      const executorResult = await handleWebsocketEvent(
        lambdaEvent as any,
        runtime
      )

      log.verbose(`executorResult: ${JSON.stringify(executorResult)}`)

      return executorResult
    } else if (lambdaEvent.headers != null && lambdaEvent.httpMethod != null) {
      logRuntimeCase('API')

      const overrideParams =
        lambdaEvent.requestStartTime !== undefined &&
        Number.isSafeInteger(lambdaEvent.requestStartTime)
          ? {
              getVacantTimeInMillis: () =>
                (lambdaEvent.requestStartTime ?? 0) +
                WORKER_HTTP_REQUEST_DURATION -
                Date.now(),
            }
          : {}

      const data = await makeRuntime(overrideParams)

      runtime = data.runtime

      runtime.eventStoreAdapter.establishTimeLimit(data.getVacantTimeInMillis)

      log.verbose(
        JSON.stringify(lambdaEvent.httpMethod, null, 2),
        JSON.stringify(lambdaEvent.headers, null, 2)
      )

      const executorResult = await handleApiGatewayEvent(
        lambdaEvent,
        lambdaContext,
        runtime,
        {
          performanceTracer: coldStartContext.performanceTracer,
          buildTimeConstants: coldStartContext.constants,
          routesTrie: coldStartContext.routesTrie,
          domain: coldStartContext.domain,
          domainInterop: coldStartContext.domainInterop,
          eventSubscriberScope: coldStartContext.eventSubscriberScope,
          seedClientEnvs: coldStartContext.seedClientEnvs,
          eventListeners: coldStartContext.eventListeners,
        }
      )

      log.verbose(`executorResult: ${JSON.stringify(executorResult)}`)

      return executorResult
    } else {
      void ({ runtime } = await makeRuntime({}))
      throw new Error(
        `abnormal lambda execution on event ${JSON.stringify(lambdaEvent)}`
      )
    }
  } catch (error) {
    log.error(
      `top-level event handler execution error! Event: ${JSON.stringify(
        lambdaEvent
      )}`
    )

    runtime?.monitoring?.group({ Part: 'Internal' }).error(error)

    if (error instanceof Error) {
      log.error('Lambda top-level error message:', error.message)
      log.error('Lambda top-level error stack:', error.stack)
    } else {
      log.error('Lambda unknown top-level error:', JSON.stringify(error))
    }

    throw error
  } finally {
    if (runtime != null) {
      await runtime.dispose()
    }

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

export const initLambdaWorker = async (
  serverAssemblies: RuntimeAssemblies
): Promise<RuntimeWorker<WorkerArguments, WorkerResult>> => {
  const { constants, domain, resolveVersion } = serverAssemblies
  const assemblies = prepareAssemblies(
    serverAssemblies.assemblies,
    serverAssemblies
  )
  let subSegment: PerformanceSubsegment | null = null

  log.debug(`starting lambda 'cold start'`)
  const domainInterop = initDomain(domain)

  try {
    log.debug('building lambda cold start context entries')
    const performanceTracer = await performanceTracerFactory()
    const monitoring = createCompositeMonitoringAdapter(
      assemblies.monitoringAdapters
    )

    const segment = performanceTracer.getSegment()
    subSegment = segment.addNewSubsegment('initResolve')

    const uploader = await uploaderFactory({
      uploaderAdapterFactory: assemblies.uploadAdapter,
    })
    const getReactiveSubscription = getReactiveSubscriptionFactory()

    const coldStartContext: LambdaColdStartContext = {
      seedClientEnvs: assemblies.seedClientEnvs,
      serverImports: assemblies.serverImports,
      domain,
      ...constants,
      assemblies,
      domainInterop,
      eventListeners: gatherEventListeners(domain, domainInterop),
      eventSubscriberScope: getDeploymentId(),
      upstream: true,
      resolveVersion,
      performanceTracer,
      monitoring,
      getReactiveSubscription,
      sendReactiveEvent,
      routesTrie: wrapTrie(
        domain.apiHandlers,
        constants.staticRoutes,
        constants.rootPath
      ),
      uploader,
      constants,
    }

    log.debug(`lambda 'cold start' succeeded`)

    return lambdaWorker.bind(null, coldStartContext)
  } catch (error) {
    log.error(`lambda 'cold start' failure`, error)
    if (subSegment != null) subSegment.addError(error)
  } finally {
    if (subSegment != null) {
      subSegment.close()
    }
  }
  return async () => {
    throw Error(`Lambda worker was not created due to cold start failure`)
  }
}
