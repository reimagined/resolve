import 'source-map-support/register'
import partial from 'lodash.partial'

import { initDomain } from '@resolve-js/core'
import {
  wrapTrie,
  getLog,
  gatherEventListeners,
  RuntimeWorker,
  createCompositeMonitoringAdapter,
} from '@resolve-js/runtime-base'

import { performanceTracerFactory } from './performance-tracer-factory'
import { lambdaWorker } from './lambda-worker'
import { uploaderFactory } from './uploader-factory'
import { getReactiveSubscriptionFactory } from './get-reactive-subscription-factory'
import { getDeploymentId } from './utils'
import { sendReactiveEvent } from './send-reactive-event'

import type {
  RuntimeModuleFactory,
  RuntimeEntryContext,
} from '@resolve-js/runtime-base'
import type { PerformanceSubsegment } from '@resolve-js/core'
import type {
  RuntimeOptions,
  WorkerArguments,
  LambdaColdStartContext,
  WorkerResult,
} from './types'
import { prepareAssemblies } from './prepare-assemblies'

const log = getLog('aws-serverless-entry')

const entry = async (
  options: RuntimeOptions,
  context: RuntimeEntryContext
): Promise<RuntimeWorker<WorkerArguments, WorkerResult>> => {
  const { constants, domain, resolveVersion } = context
  const assemblies = prepareAssemblies(context.assemblies, context)
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

    return partial(lambdaWorker, coldStartContext)
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

const factory: RuntimeModuleFactory<
  RuntimeOptions,
  WorkerArguments,
  WorkerResult
> = (options: RuntimeOptions) => ({
  entry: partial(entry, options),
  execMode: 'external',
})

export default factory
