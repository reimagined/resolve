import wrapReadModel from './wrap_read_model'
import wrapViewModel from './wrap_view_model'

const createQuery = ({
  readModelConnectors,
  snapshotAdapter,
  doUpdateRequest,
  readModels,
  viewModels,
  eventStore
}) => {
  const models = {}
  for (const readModel of readModels) {
    if (models[readModel.name] != null) {
      throw new Error(`Duplicate name for read/view model: ${readModel.name}`)
    }
    models[readModel.name] = wrapReadModel(
      readModel,
      readModelConnectors,
      doUpdateRequest
    )
  }

  for (const viewModel of viewModels) {
    if (models[viewModel.name] != null) {
      throw new Error(`Duplicate name for read/view model: ${viewModel.name}`)
    }
    models[viewModel.name] = wrapViewModel(
      viewModel,
      snapshotAdapter,
      eventStore
    )
  }

  const checkModelExists = modelName => {
    if (models[modelName] == null) {
      const error = new Error(`Read/view model ${modelName} does not exist`)
      error.code = 422
      throw error
    }
  }

  const parseOptions = options => {
    const optionsFlags = {
      modelOptions: 1 << 0,
      modelArgs: 1 << 1,
      resolverName: 1 << 2,
      resolverArgs: 1 << 3,
      aggregateIds: 1 << 4,
      aggregateArgs: 1 << 5
    }

    const optionsMap = []
    optionsMap[optionsFlags.modelOptions] = optionsMap[
      optionsFlags.modelOptions + optionsFlags.modelArgs
    ] = ['modelOptions', 'modelArgs']
    optionsMap[optionsFlags.resolverName] = optionsMap[
      optionsFlags.resolverName + optionsFlags.resolverArgs
    ] = ['resolverName', 'resolverArgs']
    optionsMap[optionsFlags.aggregateIds] = optionsMap[
      optionsFlags.aggregateIds + optionsFlags.aggregateArgs
    ] = ['aggregateIds', 'aggregateArgs']

    let flag = 0
    for (const key of Object.keys(options)) {
      flag += ~~optionsFlags[key]
    }

    if (optionsMap[flag] == null) {
      throw new Error('Wrong options for read invocation')
    }

    return [options[optionsMap[flag][0]], options[optionsMap[flag][1]]]
  }

  const read = async ({ modelName, jwtToken, ...options }) => {
    checkModelExists(modelName)
    const [modelOptions, modelArgs] = parseOptions(options)

    const result = await models[modelName].read(
      modelOptions,
      modelArgs,
      jwtToken
    )

    return result
  }

  const readAndSerialize = async ({ modelName, jwtToken, ...options }) => {
    checkModelExists(modelName)
    const [modelOptions, modelArgs] = parseOptions(options)

    const result = await models[modelName].readAndSerialize(
      modelOptions,
      modelArgs,
      jwtToken
    )

    return result
  }

  const updateByEvents = async (modelName, events) => {
    checkModelExists(modelName)
    if (!Array.isArray(events)) {
      throw new Error('Updating by events should supply events array')
    }

    await models[modelName].updateByEvents(events)
  }

  const drop = async modelName => {
    checkModelExists(modelName)

    await models[modelName].drop()
  }

  const dispose = async () => {
    for (const modelName of Object.keys(models)) {
      await models[modelName].dispose()
    }

    for (const connector of Object.values(readModelConnectors)) {
      await connector.disconnect()
    }
  }

  const api = {
    read,
    readAndSerialize,
    updateByEvents,
    drop,
    dispose
  }

  const executeQuery = (...args) => read(...args)
  Object.assign(executeQuery, api)

  return executeQuery
}

export default createQuery
