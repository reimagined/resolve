import wrapReadModel, {
  FULL_XA_CONNECTOR,
  FULL_REGULAR_CONNECTOR,
  EMPTY_CONNECTOR,
  INLINE_LEDGER_CONNECTOR,
  detectConnectorFeatures
} from './wrap-read-model'
import wrapViewModel from './wrap-view-model'

const parseReadOptions = (options: any): any => {
  const optionsFlags: any = {
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

const dispose = async (models: any): Promise<any> => {
  for (const modelName of Object.keys(models)) {
    await models[modelName].dispose()
  }
}

const interopApi = async (models: any, key: string, ...args: Array<any>) => {
  if (args.length !== 1 || Object(args[0]) !== args[0]) {
    throw new TypeError(
      `Invalid resolve-query method "${key}" arguments ${args}`
    )
  }

  let { eventSubscriber, modelName, ...parameters } = args[0]

  if (eventSubscriber == null && modelName == null) {
    throw new Error(`Either "eventSubscriber" nor "modelName" is null`)
  } else if (modelName == null) {
    modelName = eventSubscriber
  }
 
  if (models[modelName] == null) {
    const error = new Error(
      `Read/view model "${modelName}" does not exist`
    ) as any
    error.code = 422
    throw error
  }

  const method = models[modelName][key]

  if (typeof method !== 'function') {
    throw new TypeError(
      `Model "${modelName}" does not implement method "${key}"`
    )
  }

  const result = await method(parameters)

  return result
}

const createQuery = ({
  invokeEventBusAsync,
  readModelConnectors,
  readModels,
  viewModels,
  performanceTracer,
  eventstoreAdapter
}: {
  invokeEventBusAsync: Function
  readModelConnectors: any
  readModels: any[]
  viewModels: any[]
  performanceTracer: any
  eventstoreAdapter: any
}): any => {
  const models: {
    [key: string]: any
  } = {}
  for (const readModel of readModels) {
    if (models[readModel.name] != null) {
      throw new Error(`Duplicate name for read model: "${readModel.name}"`)
    }
    models[readModel.name] = wrapReadModel(
      readModel,
      readModelConnectors,
      eventstoreAdapter,
      invokeEventBusAsync,
      performanceTracer,
      eventstoreAdapter.getSecretsManager.bind(null),
      parseReadOptions
    )
  }

  for (const viewModel of viewModels) {
    if (models[viewModel.name] != null) {
      throw new Error(`Duplicate name for view model: "${viewModel.name}"`)
    }
    models[viewModel.name] = wrapViewModel(
      viewModel,
      eventstoreAdapter,
      performanceTracer,
      eventstoreAdapter.getSecretsManager.bind(null),
      parseReadOptions
    )
  }

  const read = interopApi.bind(null, 'read') as any
  const api = new Proxy(read, {
    get(_: any, key: string): any {
      if (key === 'bind' || key === 'apply' || key === 'call') {
        return read[key].bind(read)
      } else if (key === 'dispose') {
        return dispose.bind(null, models)
      } else {
        return interopApi.bind(null, models, key)
      }
    },
    set() {
      throw new TypeError(`Resolve-query API is immutable`)
    }
  } as any)

  return api
}

export {
  FULL_XA_CONNECTOR,
  FULL_REGULAR_CONNECTOR,
  EMPTY_CONNECTOR,
  INLINE_LEDGER_CONNECTOR,
  detectConnectorFeatures
}
export default createQuery
