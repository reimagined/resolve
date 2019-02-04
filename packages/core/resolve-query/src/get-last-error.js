const getLastError = async (
  { checkQueryDisposeState, getExecutor, executors, disposePromise },
  { modelName, ...options }
) => {
  checkQueryDisposeState(disposePromise)
  const executor = getExecutor({ executors }, modelName)
  return await executor.getLastError(options)
}

export default getLastError
