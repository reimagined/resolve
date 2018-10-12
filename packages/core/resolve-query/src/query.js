import createReadModel from './read-model'
import createViewModel from './view-model'

import { modelTypes, errors } from './constants'

const createQuery = ({
  eventStore,
  viewModels,
  readModels,
  snapshotAdapter
}) => {
  const executors = new Map()
  const executorTypes = new Map()
  const executorDeserializers = new Map()
  const errorMessages = []
  let disposePromise = null

  const checkQueryDisposeState = () => {
    if (disposePromise != null) {
      throw new Error(errors.disposed)
    }
  }

  for (const readModel of readModels) {
    if (executors.has(readModel.name)) {
      errorMessages.push(`${errors.duplicateName} ${readModel}`)
    }

    const executor = createReadModel({
      projection: readModel.projection,
      resolvers: readModel.resolvers,
      adapter: readModel.adapter(),
      eventStore
    })

    executors.set(readModel.name, executor)
    executorTypes.set(executor, modelTypes.readModel)
    executorDeserializers.set(readModel.name, JSON.parse)
  }

  for (const viewModel of viewModels) {
    if (executors.has(viewModel.name)) {
      errorMessages.push(`${errors.duplicateName} "${viewModel}"`)
    }

    const executor = createViewModel({
      projection: viewModel.projection,
      invariantHash: viewModel.invariantHash,
      serializeState: viewModel.serializeState,
      snapshotAdapter,
      eventStore
    })

    executors.set(viewModel.name, executor)
    executorTypes.set(executor, modelTypes.viewModel)
    executorDeserializers.set(viewModel.name, viewModel.deserializeState)
  }

  if (errorMessages.length > 0) {
    for (const executor of executors.values()) {
      executor.dispose()
    }
    throw new Error(errorMessages.join('\n'))
  }

  const getDeserializer = modelName => {
    const deserializer = executorDeserializers.get(modelName)
    if (deserializer == null) {
      throw new Error(`${errors.modelNotFound} "${modelName}"`)
    }
    return deserializer
  }

  const getExecutor = modelName => {
    const executor = executors.get(modelName)
    if (executor == null) {
      throw new Error(`${errors.modelNotFound} "${modelName}"`)
    }
    return executor
  }

  const api = Object.freeze({
    read: async ({ modelName, ...options }) => {
      checkQueryDisposeState()
      const executor = getExecutor(modelName)
      return await executor.read(options)
    },

    readAndSerialize: async ({ modelName, ...options }) => {
      checkQueryDisposeState()
      const executor = getExecutor(modelName)
      return await executor.readAndSerialize(options)
    },

    getLastError: async ({ modelName, ...options }) => {
      checkQueryDisposeState()
      const executor = getExecutor(modelName)
      return await executor.getLastError(options)
    },

    getModelType: modelName => {
      checkQueryDisposeState()
      const executor = executors.get(modelName)
      return executorTypes.get(executor)
    },

    getDeserializer: ({ modelName }) => {
      checkQueryDisposeState()
      return getDeserializer(modelName)
    },

    dispose: () => {
      if (disposePromise == null) {
        disposePromise = (async () => {
          for (const executor of executors.values()) {
            await executor.dispose()
          }
          executorDeserializers.clear()
          executorTypes.clear()
          executors.clear()
        })()
      }

      return disposePromise
    },

    getExecutors: () => {
      checkQueryDisposeState()
      return executors
    }
  })

  const query = (...args) => api.read(...args)
  Object.assign(query, api)
  return query
}

export default createQuery
