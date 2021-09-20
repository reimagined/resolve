import 'source-map-support/register'

import { initDomain } from '@resolve-js/core'
import {
  wrapTrie,
  getLog,
  gatherEventListeners,
} from '@resolve-js/runtime-base'

import { performanceTracerFactory } from './performance-tracer-factory'
import { lambdaWorker } from './lambda-worker'
import { uploaderFactory } from './uploader-factory'
import { getReactiveSubscriptionFactory } from './get-reactive-subscription-factory'

import type { PerformanceTracer, Domain } from '@resolve-js/core'
import type {
  Assemblies,
  BuildTimeConstants,
  DomainWithHandlers,
  ReactiveSubscriptionFactory,
  Resolve,
  Uploader,
} from '@resolve-js/runtime-base'

import type { PerformanceSubsegment } from '@resolve-js/core'
import { getDeploymentId } from './utils'
import { sendReactiveEvent } from './send-reactive-event'

const log = getLog('aws-serverless-entry')

export type LambdaColdStartContext = {
  readonly performanceTracer: PerformanceTracer
  readonly seedClientEnvs: Resolve['seedClientEnvs']
  readonly serverImports: Resolve['serverImports']
  readonly constants: BuildTimeConstants
  // TODO: why we still need domain meta outside core?
  readonly domain: DomainWithHandlers
  readonly domainInterop: Domain
  readonly eventListeners: Resolve['eventListeners']
  readonly eventSubscriberScope: string
  readonly upstream: boolean
  readonly resolveVersion: string
  readonly routesTrie: Resolve['routesTrie']
  readonly uploader: Uploader | null
  readonly sendReactiveEvent: Resolve['sendReactiveEvent']
  // TODO: rename to getSubscriptionAdapterOptions
  readonly getReactiveSubscription: ReactiveSubscriptionFactory
  // TODO: do we really need this somewhere?
  readonly assemblies: Resolve['assemblies']
  // TODO: what is this?
  readonly publisher: any
}

const index = async ({
  assemblies,
  constants,
  domain,
  resolveVersion,
}: {
  assemblies: Assemblies
  constants: BuildTimeConstants
  domain: Resolve['domain']
  resolveVersion: string
}) => {
  let subSegment: PerformanceSubsegment | null = null

  log.debug(`starting lambda 'cold start'`)
  const domainInterop = initDomain(domain)

  try {
    log.debug('building lambda cold start context entries')

    const performanceTracer = await performanceTracerFactory()
    const uploader = await uploaderFactory({
      uploaderAdapterFactory: assemblies.uploadAdapter,
    })
    const getReactiveSubscription = getReactiveSubscriptionFactory()

    const coldStartContext: LambdaColdStartContext = {
      seedClientEnvs: assemblies.seedClientEnvs,
      serverImports: assemblies.serverImports,
      domain,
      ...constants,
      // TODO: what is this?
      publisher: {},
      assemblies,
      domainInterop,
      eventListeners: gatherEventListeners(domain, domainInterop),
      eventSubscriberScope: getDeploymentId(),
      upstream: true,
      resolveVersion,
      performanceTracer,
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

    const segment = performanceTracer.getSegment()
    subSegment = segment.addNewSubsegment('initResolve')

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
}

export default index
