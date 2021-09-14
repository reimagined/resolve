import wrapApiHandler from './wrap-api-handler'
import { mainHandler } from '../common/handlers/main-handler'

import type { Resolve } from '../common/types'

const getCustomParameters = async (resolve: Resolve) => ({ resolve })

const apiGatewayHandler = async (
  lambdaEvent: any,
  lambdaContext: any,
  resolve: Resolve
) => {
  const executor = wrapApiHandler(
    mainHandler,
    getCustomParameters.bind(null, resolve),
    resolve.monitoring.group({ Part: 'ApiHandler' })
  )

  const segment = resolve.performanceTracer.getSegment()
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

export default apiGatewayHandler
