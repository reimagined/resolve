import createReadModel from './read-model'
import createViewModel from './view-model'

import { modelTypes, errors } from './constants'

const createQuery = ({ eventStore, viewModels, readModels }) => {
  const executors = new Map()
  const executorTypes = new WeakMap()
  const errorMessages = []

  for (const readModel of readModels) {
    if (executors.has(readModel.name)) {
      errorMessages.push(`${errors.duplicateName} ${readModel}`)
    }

    const executor = createReadModel({
      projection: readModel.projection,
      resolvers: readModel.resolvers,
      adapter: readModel.adapter.module(readModel.adapter.options),
      eventStore
    })

    executors.set(readModel.name, executor)
    executorTypes.set(executor, modelTypes.readModel)
  }

  for (const viewModel of viewModels) {
    if (executors.has(viewModel.name)) {
      errorMessages.push(`${errors.duplicateName} "${viewModel}"`)
    }

    let snapshotAdapter, snapshotBucketSize
    if (viewModel.snapshotAdapter) {
      const createSnapshotAdapter = viewModel.snapshotAdapter.module
      const snapshotAdapterOptions = viewModel.snapshotAdapter.options

      snapshotAdapter = createSnapshotAdapter(snapshotAdapterOptions)
      snapshotBucketSize = snapshotAdapterOptions.bucketSize
    }

    const executor = createViewModel({
      projection: viewModel.projection,
      invariantHash: viewModel.invariantHash,
      serializeState: viewModel.serializeState,
      snapshotAdapter,
      snapshotBucketSize,
      eventStore
    })

    executors.set(viewModel.name, executor)
    executorTypes.set(executor, modelTypes.viewModel)
  }

  if (errorMessages.length > 0) {
    for (const executor of executors.values()) {
      executor.dispose()
    }
    throw new Error(errorMessages.join('\n'))
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
      const executor = getExecutor(modelName)
      return await executor.read(options)
    },

    readAndSerialize: async ({ modelName, ...options }) => {
      const executor = getExecutor(modelName)
      return await executor.readAndSerialize(options)
    },

    getLastError: async ({ modelName, ...options }) => {
      const executor = getExecutor(modelName)
      return await executor.getLastError(options)
    },

    getModelType: modelName => {
      const executor = executors.get(modelName)
      return executorTypes.get(executor)
    },

    getExecutors: () => executors
  })

  const query = (...args) => api.read(...args)
  Object.assign(query, api)
  return query
}

export default createQuery
