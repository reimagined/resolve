const invokeMetaLock = async (resolve, listenerId, operation, options) =>
  await resolve.lambda
    .invoke({
      FunctionName: process.env.RESOLVE_META_LOCK_LAMBDA_ARN,
      Payload: JSON.stringify({
        ...options,
        listenerId,
        operation
      })
    })
    .promise()

export default invokeMetaLock
