import wrapReadModel, {
  FULL_XA_CONNECTOR,
  FULL_REGULAR_CONNECTOR,
  EMPTY_CONNECTOR,
  INLINE_LEDGER_CONNECTOR,
  detectConnectorFeatures,
} from './wrap-read-model'
import wrapViewModel from './wrap-view-model'

import { CreateQueryOptions } from './types'

const dispose = async (models: any): Promise<any> => {
  for (const modelName of Object.keys(models)) {
    await models[modelName].dispose()
  }
}

const interopApi = async (models: any, key: string, ...args: Array<any>) => {
  if (args.length !== 1 || Object(args[0]) !== args[0]) {
    throw new TypeError(
      `Invalid resolve-query method "${key}" arguments ${JSON.stringify(args)}`
    )
  }

  // eslint-disable-next-line prefer-const
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

const createQuery = (params: CreateQueryOptions): any => {
  const models: {
    [key: string]: any
  } = {}

  const { acquireReadModelsInterop } = params.domainInterop.readModelDomain

  const readModelsInterop = acquireReadModelsInterop({
    getSecretsManager: params.eventstoreAdapter.getSecretsManager,
    monitoring: {
      error: params.monitoring?.error,
      performance: params.performanceTracer,
    },
  })

  const { readModels, viewModels, ...imports } = params

  for (const readModel of readModels) {
    if (models[readModel.name] != null) {
      throw new Error(`Duplicate name for read model: "${readModel.name}"`)
    }
    models[readModel.name] = wrapReadModel({
      readModel,
      interop: readModelsInterop[readModel.name],
      ...imports,
    })
  }

  for (const viewModel of viewModels) {
    if (models[viewModel.name] != null) {
      throw new Error(`Duplicate name for view model: "${viewModel.name}"`)
    }
    models[viewModel.name] = wrapViewModel({ viewModel, ...imports })
  }

  const read = interopApi.bind(null, models, 'read') as any
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
    },
  } as any)

  return api
}

export {
  FULL_XA_CONNECTOR,
  FULL_REGULAR_CONNECTOR,
  EMPTY_CONNECTOR,
  INLINE_LEDGER_CONNECTOR,
  detectConnectorFeatures,
}
export default createQuery
