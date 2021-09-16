import partial from 'lodash.partial'
import { wrapApiHandler } from './wrap-api-handler'
import { mainHandler } from '../common/handlers/main-handler'

import type { Monitoring, PerformanceTracer } from '@resolve-js/core'
import type { Runtime } from '../common/create-runtime'
import { BuildTimeConstants, createUserResolve } from '../common'
import { Trie } from 'route-trie'

export const handleApiGatewayEvent = async (
  lambdaEvent: any,
  lambdaContext: any,
  runtime: Runtime,
  {
    monitoring,
    performanceTracer,
    buildTimeConstants,
    routesTrie,
  }: {
    monitoring: Monitoring
    performanceTracer: PerformanceTracer
    buildTimeConstants: BuildTimeConstants
    routesTrie: Trie
  }
) => {
  const getCustomParameters = () => ({
    resolve: createUserResolve(runtime, {
      constants: buildTimeConstants,
      routesTrie,
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
