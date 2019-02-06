const getModelType = (
  { checkQueryDisposeState, executors, executorTypes, disposePromise },
  entity
) => {
  checkQueryDisposeState(disposePromise)
  if (
    entity == null ||
    !(entity.constructor === String || entity.constructor === Object)
  ) {
    throw new Error(
      'Function getModelType accepts model name or model executor'
    )
  }
  if (entity.constructor === String) {
    const executor = executors.get(entity)
    return executorTypes.get(executor)
  } else {
    return executorTypes.get(entity)
  }
}

export default getModelType
