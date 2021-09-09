import wrapReadModel from './wrap-read-model'
import wrapViewModel from './wrap-view-model'

import type { CreateQueryOptions } from './types'
import { OMIT_BATCH, STOP_BATCH } from './batch'

const dispose = async (models: any): Promise<any> => {
  for (const modelName of Object.keys(models)) {
    await models[modelName].dispose()
  }
}

const interopApi = async (models: any, key: string, ...args: Array<any>) => {
  if (args.length > 2 || Object(args[0]) !== args[0]) {
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
  const middlewareContext = args.length > 1 ? args[1] : {}

  return await method(parameters, middlewareContext)
}

const createQuery = (params: CreateQueryOptions): any => {
  const models: {
    [key: string]: any
  } = {}

  const { viewModelsInterop, readModelsInterop, ...imports } = params

  for (const model of Object.values(readModelsInterop)) {
    models[model.name] = wrapReadModel({
      interop: model,
      ...imports,
    })
  }

  for (const model of Object.values(viewModelsInterop)) {
    models[model.name] = wrapViewModel({
      interop: model,
      ...imports,
    })
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

export { OMIT_BATCH, STOP_BATCH }
export type { CreateQueryOptions }
export default createQuery
