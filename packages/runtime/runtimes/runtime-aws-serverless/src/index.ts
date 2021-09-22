import 'source-map-support/register'
import partial from 'lodash.partial'

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
import { getDeploymentId } from './utils'
import { sendReactiveEvent } from './send-reactive-event'

import type { Trie } from 'route-trie'
import type { PerformanceTracer, Domain } from '@resolve-js/core'
import type {
  Assemblies,
  BuildTimeConstants,
  ReactiveSubscriptionFactory,
  Runtime,
  RuntimeFactoryParameters,
  RuntimeModuleFactory,
  RuntimeEntryContext,
} from '@resolve-js/runtime-base'
import type { PerformanceSubsegment } from '@resolve-js/core'
import type { OmitFirstParameter } from './types'

const log = getLog('aws-serverless-entry')

export type LambdaColdStartContext = {
  readonly performanceTracer: PerformanceTracer
  readonly seedClientEnvs: RuntimeFactoryParameters['seedClientEnvs']
  readonly serverImports: RuntimeFactoryParameters['serverImports']
  readonly constants: BuildTimeConstants
  // TODO: why we still need domain meta outside core?
  readonly domain: RuntimeFactoryParameters['domain']
  readonly domainInterop: Domain
  readonly eventListeners: RuntimeFactoryParameters['eventListeners']
  readonly eventSubscriberScope: string
  readonly upstream: boolean
  readonly resolveVersion: string
  readonly routesTrie: Trie
  readonly uploader: Runtime['uploader']
  readonly sendReactiveEvent: RuntimeFactoryParameters['sendReactiveEvent']
  // TODO: rename to getSubscriptionAdapterOptions
  readonly getReactiveSubscription: ReactiveSubscriptionFactory
  // TODO: do we really need this somewhere?
  readonly assemblies: Assemblies
  // TODO: what is this?
  readonly publisher: any
}

type RuntimeOptions = {}
type WorkerArguments = OmitFirstParameter<Parameters<typeof lambdaWorker>>

export const entry = async (
  options: RuntimeOptions,
  context: RuntimeEntryContext
) => {
  const { assemblies, constants, domain, resolveVersion } = context
  let subSegment: PerformanceSubsegment | null = null

  log.debug(`starting lambda 'cold start'`)
  const domainInterop = initDomain(domain)

  try {
    log.debug('building lambda cold start context entries')
    const performanceTracer = await performanceTracerFactory()

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

const factory: RuntimeModuleFactory<RuntimeOptions, WorkerArguments> = (
  options: RuntimeOptions
) => ({
  entry: partial(entry, options),
  execMode: 'external',
})

export default factory
