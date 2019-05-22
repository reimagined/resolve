import wrapApiHandler from 'resolve-api-handler-awslambda'

import mainHandler from '../common/handlers/main-handler'

const getCustomParameters = async resolve => ({ resolve })

const apiGatewayHandler = async (lambdaEvent, lambdaContext, resolve) => {
  const executor = wrapApiHandler(
    mainHandler,
    getCustomParameters.bind(null, resolve)
  )

  return await executor(lambdaEvent, lambdaContext)
}

export default apiGatewayHandler
