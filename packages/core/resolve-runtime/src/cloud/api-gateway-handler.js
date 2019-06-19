import wrapApiHandler from 'resolve-api-handler-awslambda'

import mainHandler from '../common/handlers/main-handler'

const getCustomParameters = async resolve => ({ resolve })

const apiGatewayHandler = async (lambdaEvent, lambdaContext, resolve) => {
  const executor = wrapApiHandler(
    mainHandler,
    getCustomParameters.bind(null, resolve)
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
