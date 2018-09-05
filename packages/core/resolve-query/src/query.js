import createReadModel from './read-model'
import createViewModel from './view-model'

const duplicateName = 'A read/view name is not unique'
const modelNotFound = 'A read/view model is not defined'

const createQuery = ({ eventStore, viewModels, readModels }) => {
  const executors = new Map()
  const errors = []

  for (const readModel of readModels) {
    if (executors.has(readModel.name)) {
      errors.push(`${duplicateName} ${readModel}`)
    }

    const executor = createReadModel({
      projection: readModel.projection,
      resolvers: readModel.resolvers,
      adapter: readModel.adapter.module(readModel.adapter.options),
      eventStore
    })

    executors.set(readModel.name, executor)
  }

  for (const viewModel of viewModels) {
    if (executors.has(viewModel.name)) {
      errors.push(`${duplicateName} "${viewModel}"`)
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
  }

  if (errors.length > 0) {
    for (const executor of executors.values()) {
      executor.dispose()
    }
    throw new Error(errors.join('\n'))
  }

  const getExecutor = modelName => {
    const executor = executors.get(modelName)
    if (executor == null) {
      throw new Error(`${modelNotFound} "${modelName}"`)
    }
    return executor
  }

  return Object.freeze({
    read: async ({ modelName, ...options }) => {
      const executor = getExecutor(modelName)
      return await executor.read(...options)
    },

    readAndSerialize: async ({ modelName, ...options }) => {
      const executor = getExecutor(modelName)
      return await executor.readAndSerialize(...options)
    },

    getExecutors: () => executors
  })
}

export default createQuery
