const readAndSerialize = async (
  { checkQueryDisposeState, getExecutor, executors, disposePromise },
  { modelName, ...options }
) => {
  checkQueryDisposeState(disposePromise)
  const executor = getExecutor(executors, modelName)
  return await executor.readAndSerialize(options)
}

export default readAndSerialize
