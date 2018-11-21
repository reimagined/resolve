const getModelType = (
  { checkQueryDisposeState, executors, executorTypes, disposePromise },
  modelName
) => {
  checkQueryDisposeState(disposePromise)
  const executor = executors.get(modelName)
  return executorTypes.get(executor)
}

export default getModelType
