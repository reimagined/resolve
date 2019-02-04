import { errors } from './constants'

const getExecutor = ({ executors }, modelName) => {
  const executor = executors.get(modelName)
  if (executor == null) {
    throw new Error(`${errors.modelNotFound} "${modelName}"`)
  }
  return executor
}

export default getExecutor
