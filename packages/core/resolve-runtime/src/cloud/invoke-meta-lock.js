const invokeMetaLock = async (resolve, listenerId, operation) =>
  await resolve.lambda
    .invoke({
      FunctionName: process.env.RESOLVE_META_LOCK_LAMBDA_ARN,
      Payload: JSON.stringify({
        listenerId,
        operation
      })
    })
    .promise()

export default invokeMetaLock
