import wrapApiHandler from './wrap-api-handler'
import mainHandler from '../common/handlers/main-handler'

const getCustomParameters = async (resolve) => ({ resolve })

const apiGatewayHandler = async (lambdaEvent, lambdaContext, resolve) => {
  const onError = async (error) => {
    try {
      await resolve.onError(error, 'api-handler')
    } catch (e) {}
  }

  const executor = wrapApiHandler(
    mainHandler,
    getCustomParameters.bind(null, resolve),
    onError
  )

  const segment = resolve.performanceTracer.getSegment()
  const subSegment = segment.addNewSubsegment('apiHandler')

  try {
    return await executor(lambdaEvent, lambdaContext)
  } catch (error) {
    subSegment.addError(error)
    await onError(error)
    throw error
  } finally {
    subSegment.close()
  }
}

export default apiGatewayHandler
