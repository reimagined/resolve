import { modelTypes } from './constants'

const read = async (pool, { modelName, ...options }) => {
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
    await updateRequest(pool, modelName)
  }

  return await executor.read(options)
}

export default read
