import partial from 'lodash.partial'
import { Trie } from 'route-trie'

import { mainHandler, createUserResolve } from '@resolve-js/runtime-base'
import { wrapApiHandler } from './wrap-api-handler'

import type {
  Domain,
  DomainMeta,
  Monitoring,
  PerformanceTracer,
} from '@resolve-js/core'
import type {
  Runtime,
  Assemblies,
  BuildTimeConstants,
  EventListeners,
} from '@resolve-js/runtime-base'

export const handleApiGatewayEvent = async (
  lambdaEvent: any,
  lambdaContext: any,
  runtime: Runtime,
  {
    monitoring,
    performanceTracer,
    buildTimeConstants,
    routesTrie,
    domain,
    domainInterop,
    eventSubscriberScope,
    seedClientEnvs,
    eventListeners,
  }: {
    monitoring: Monitoring
    performanceTracer: PerformanceTracer
    buildTimeConstants: BuildTimeConstants
    routesTrie: Trie
    domain: DomainMeta
    domainInterop: Domain
    eventSubscriberScope: string
    seedClientEnvs: Assemblies['seedClientEnvs']
    eventListeners: EventListeners
  }
) => {
  const getCustomParameters = () => ({
    resolve: createUserResolve(runtime, {
      constants: buildTimeConstants,
      routesTrie,
      domain,
      domainInterop,
      eventSubscriberScope,
      performanceTracer,
      seedClientEnvs,
      eventListeners,
    }),
  })

  const executor = wrapApiHandler(
    mainHandler,
    partial(getCustomParameters, runtime),
    monitoring.group({ Part: 'ApiHandler' })
  )

  const segment = performanceTracer.getSegment()
  const subSegment = segment.addNewSubsegment('apiHandler')

  try {
    return await executor(lambdaEvent, lambdaContext)
  } catch (error) {
    subSegment.addError(error)
    throw error
  } finally {
    subSegment.close()
  }
}
