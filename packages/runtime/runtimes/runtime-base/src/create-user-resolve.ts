import type {
  Assemblies,
  BuildTimeConstants,
  Runtime,
  RuntimeFactoryParameters,
  UserBackendResolve,
} from './types'
import type { Trie } from 'route-trie'
import type { PerformanceTracer } from '@resolve-js/core'

// TODO: review/refactor/rename - do something with that already
export type AdditionalUserData = {
  constants: BuildTimeConstants
  seedClientEnvs: Assemblies['seedClientEnvs']
  // TODO: excessive internal data access
  routesTrie: Trie
  domain: RuntimeFactoryParameters['domain']
  domainInterop: RuntimeFactoryParameters['domainInterop']
  eventSubscriberScope: string
  // TODO: push to runtime interface?
  performanceTracer: PerformanceTracer
  eventListeners: RuntimeFactoryParameters['eventListeners']
}

export const createUserResolve = (
  runtime: Runtime,
  additionalContext: AdditionalUserData
): UserBackendResolve => {
  return {
    ...runtime,
    ...additionalContext.constants,
    routesTrie: additionalContext.routesTrie,
    domain: additionalContext.domain,
    domainInterop: additionalContext.domainInterop,
    eventstoreAdapter: runtime.eventStoreAdapter,
    eventSubscriber: runtime.eventSubscriber,
    eventSubscriberScope: additionalContext.eventSubscriberScope,
    performanceTracer: additionalContext.performanceTracer,
    getReactiveSubscription: runtime.getReactiveSubscription,
    seedClientEnvs: additionalContext.seedClientEnvs,
    eventListeners: additionalContext.eventListeners,
  }
}
