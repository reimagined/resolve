import type {
  BuildTimeConstants,
  Runtime,
  UserBackendDependencies,
  UserBackendResolve,
} from './types'

// TODO: review/refactor/rename - do something with that already
export type AdditionalUserData = {
  constants: BuildTimeConstants
} & UserBackendDependencies

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
    eventSubscriberScope: additionalContext.eventSubscriberScope,
    performanceTracer: additionalContext.performanceTracer,
    seedClientEnvs: additionalContext.seedClientEnvs,
    eventListeners: additionalContext.eventListeners,
  }
}
