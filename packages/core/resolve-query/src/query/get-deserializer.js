const getDeserializer = (
  { checkQueryDisposeState, getExecutor, executors, disposePromise },
  { modelName }
) => {
  checkQueryDisposeState(disposePromise)
  const executor = getExecutor(executors, modelName)
  return executor.deserialize(modelName)
}

export default getDeserializer
