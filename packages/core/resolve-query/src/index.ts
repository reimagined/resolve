import wrapReadModel, {
  FULL_XA_CONNECTOR,
  FULL_REGULAR_CONNECTOR,
  EMPTY_CONNECTOR,
  INLINE_LEDGER_CONNECTOR,
  detectConnectorFeatures
} from './wrap-read-model'
import wrapViewModel from './wrap-view-model'

const getDefaultRemainingTime = (): number => 0x7fffffff

const createQuery = ({
  invokeEventListenerAsync,
  readModelConnectors,
  readModels,
  viewModels,
  performanceTracer,
  eventstoreAdapter
}: {
  invokeEventListenerAsync: Function
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
      invokeEventListenerAsync,
      performanceTracer,
      eventstoreAdapter.getSecretsManager.bind(null)
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
      eventstoreAdapter.getSecretsManager.bind(null)
    )
  }

  const checkModelExists = (modelName: string): void => {
    if (models[modelName] == null) {
      const error = new Error(
        `Read/view model "${modelName}" does not exist`
      ) as any
      error.code = 422
      throw error
    }
  }

  const parseOptions = (options: any): any => {
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

  const read = ({
    modelName,
    jwt: actualJwt,
    jwtToken: deprecatedJwt,
    ...options
  }: {
    modelName: string
    jwt: string
    jwtToken: string
    options: any[]
  }): any => {
    checkModelExists(modelName)
    const [modelOptions, modelArgs] = parseOptions(options)

    return models[modelName].read(
      modelOptions,
      modelArgs,
      actualJwt || deprecatedJwt
    )
  }

  const readAndSerialize = ({
    modelName,
    jwt: actualJwt,
    jwtToken: deprecatedJwt,
    ...options
  }: {
    modelName: string
    jwt: string
    jwtToken: string
    options: any[]
  }): any => {
    checkModelExists(modelName)
    const [modelOptions, modelArgs] = parseOptions(options)

    return models[modelName].readAndSerialize(
      modelOptions,
      modelArgs,
      actualJwt || deprecatedJwt
    )
  }

  const updateByEvents = ({
    modelName,
    events,
    getRemainingTimeInMillis,
    xaTransactionId
  }: {
    modelName: string
    events: any[]
    getRemainingTimeInMillis: Function
    xaTransactionId: any
  }): Promise<any> => {
    checkModelExists(modelName)
    if (!Array.isArray(events)) {
      throw new Error('Updating by events should supply events array')
    }

    return models[modelName].updateByEvents(
      events,
      typeof getRemainingTimeInMillis === 'function'
        ? getRemainingTimeInMillis
        : getDefaultRemainingTime,
      xaTransactionId
    )
  }

  const drop = async (modelName: string): Promise<void> => {
    checkModelExists(modelName)

    await models[modelName].drop()
  }

  const performXA = (
    operationName: string,
    {
      modelName,
      ...parameters
    }: {
      modelName: string
      parameters: any[]
    }
  ): any => {
    checkModelExists(modelName)
    if (typeof models[modelName][operationName] !== 'function') {
      const error = new Error(
        `Read/view model "${modelName}" does not support XA transactions`
      ) as any
      error.code = 405
      throw error
    }

    return models[modelName][operationName](parameters)
  }

  const performInlineLedger = async (
    methodName,
    { modelName, ...parameters }: any
  ): Promise<void> => {
    checkModelExists(modelName)

    await models[modelName][methodName](parameters)
  }

  const dispose = async (): Promise<any> => {
    for (const modelName of Object.keys(models)) {
      await models[modelName].dispose()
    }
  }

  const api = {
    read,
    readAndSerialize,
    updateByEvents,
    beginXATransaction: performXA.bind(null, 'beginXATransaction'),
    commitXATransaction: performXA.bind(null, 'commitXATransaction'),
    rollbackXATransaction: performXA.bind(null, 'rollbackXATransaction'),
    build: performInlineLedger.bind(null, 'build'),
    reset: performInlineLedger.bind(null, 'reset'),
    pause: performInlineLedger.bind(null, 'pause'),
    resume: performInlineLedger.bind(null, 'resume'),
    subscribe: performInlineLedger.bind(null, 'subscribe'),
    unsubscribe: performInlineLedger.bind(null, 'unsubscribe'),
    resubscribe: performInlineLedger.bind(null, 'resubscribe'),
    drop,
    dispose
  }

  const executeQuery = read.bind(null)
  Object.assign(executeQuery, api)

  return executeQuery
}

export {
  FULL_XA_CONNECTOR,
  FULL_REGULAR_CONNECTOR,
  EMPTY_CONNECTOR,
  INLINE_LEDGER_CONNECTOR,
  detectConnectorFeatures
}
export default createQuery
