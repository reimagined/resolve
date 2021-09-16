import partial from 'lodash.partial'
import { wrapApiHandler } from './wrap-api-handler'
import { mainHandler } from '../common/handlers/main-handler'

import type { Monitoring, PerformanceTracer } from '@resolve-js/core'
import type { Runtime } from '../common/create-runtime'

// TODO: this is "resolve' that exposed to end-user
const getCustomParameters = async (runtime: Runtime) => ({ resolve: runtime })

export const handleApiGatewayEvent = async (
  lambdaEvent: any,
  lambdaContext: any,
  runtime: Runtime,
  {
    monitoring,
    performanceTracer,
  }: {
    monitoring: Monitoring
    performanceTracer: PerformanceTracer
  }
) => {
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
