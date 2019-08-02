import debugLevels from 'resolve-debug-levels'

const log = debugLevels('resolve:resolve-runtime:cloud-entry')

const invokeMeta = async (resolve, listenerId, operation, options) => {
  const invokeFunctionName = process.env.RESOLVE_META_LAMBDA_ARN
  const invokePayload = JSON.stringify({
    ...options,
    listenerId,
    operation
  })

  log.debug(`invoking lambda ${invokeFunctionName} ${invokePayload}`)

  const { Payload, FunctionError } = await resolve.lambda
    .invoke({
      FunctionName: invokeFunctionName,
      Payload: invokePayload
    })
    .promise()

  if (FunctionError != null) {
    const { errorMessage } = JSON.parse(Payload.toString())
    throw new Error(errorMessage)
  }

  return JSON.parse(Payload.toString())
}

export default invokeMeta
