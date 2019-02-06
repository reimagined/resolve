const getExecutors = (pool, modelType = null) => {
  const {
    checkQueryDisposeState,
    executors,
    disposePromise,
    getModelType
  } = pool

  checkQueryDisposeState(disposePromise)
  const executorsArray = Array.from(executors.values())

  if (modelType == null) {
    return executorsArray
  }

  return executorsArray.filter(
    executor => getModelType(pool, executor) === modelType
  )
}

export default getExecutors
