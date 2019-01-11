import { modelTypes } from '../constants'

const readAndSerialize = async (pool, { modelName, ...options }) => {
  const {
    checkQueryDisposeState,
    getExecutor,
    getModelType,
    disposePromise,
    updateRequest
  } = pool
  checkQueryDisposeState(disposePromise)
  const executor = getExecutor(pool, modelName)

  if (getModelType(pool, modelName) === modelTypes.readModel) {
    await updateRequest(pool, modelName, options)
  }

  return await executor.readAndSerialize(options)
}

export default readAndSerialize
