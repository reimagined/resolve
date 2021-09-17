import type { Runtime } from './create-runtime'
import type {
  Assemblies,
  BuildTimeConstants,
  DomainWithHandlers,
  EventListeners,
  UserBackendResolve,
} from './types'
import type { Trie } from 'route-trie'
import type { Domain, PerformanceTracer } from '@resolve-js/core'

// TODO: review/refactor/rename - do something with that already
export type AdditionalUserData = {
  constants: BuildTimeConstants
  seedClientEnvs: Assemblies['seedClientEnvs']
  // TODO: excessive internal data access
  routesTrie: Trie
  domain: DomainWithHandlers
  domainInterop: Domain
  eventSubscriberScope: string
  // TODO: push to runtime interface?
  performanceTracer: PerformanceTracer
  eventListeners: EventListeners
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
