import debugLevels from 'resolve-debug-levels'

const log = debugLevels('resolve:resolve-runtime:cloud-entry')

const invokeUpdateLambda = async (
  { lambda },
  { name: listenerId, invariantHash, eventTypes }
) => {
  const invokeFunctionName = process.env.RESOLVE_META_LOCK_LAMBDA_ARN

  const invokePayload = JSON.stringify({
    listenerId,
    invariantHash,
    inactiveTimeout: 1000 * 60 * 60,
    eventTypes
  })

  log.debug(`invoking lambda ${invokeFunctionName} ${invokePayload}`)

  const { Payload, FunctionError } = await lambda
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

export default invokeUpdateLambda
