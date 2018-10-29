const read = async (
  { checkQueryDisposeState, getExecutor, executors, disposePromise },
  { modelName, ...options }
) => {
  checkQueryDisposeState(disposePromise)
  const executor = getExecutor(executors, modelName)
  return await executor.read(options)
}

export default read
