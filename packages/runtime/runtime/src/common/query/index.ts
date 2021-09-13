import wrapReadModel from './wrap-read-model'
import wrapViewModel from './wrap-view-model'

import type {
  CreateQueryOptions,
  WrappedViewModel,
  WrappedReadModel,
} from './types'
import type { QueryExecutor, CallMethodParams } from '../types'
import { OMIT_BATCH, STOP_BATCH } from './batch'

type WrappedModels = Record<
  string,
  Readonly<WrappedViewModel> | Readonly<WrappedReadModel>
>

const dispose = async (models: WrappedModels): Promise<void> => {
  for (const modelName of Object.keys(models)) {
    await models[modelName].dispose()
  }
}

const interopApi = async (
  models: WrappedModels,
  key: string,
  params: CallMethodParams,
  context?: any,
  ...args: any[]
) => {
  if (args.length > 0 || Object(params) !== params) {
    throw new TypeError(
      `Invalid resolve-query method "${key}" arguments ${JSON.stringify([
        params,
        context,
        ...args,
      ])}`
    )
  }

  const { eventSubscriber, modelName, ...parameters } = params
  let eventSubscriberName: string

  if (eventSubscriber == null) {
    if (modelName == null) {
      throw new Error(`Both "eventSubscriber" and "modelName" are null`)
    }
    eventSubscriberName = modelName
  } else {
    eventSubscriberName = eventSubscriber
  }

  if (models[eventSubscriberName] == null) {
    const error = new Error(
      `Read/view model "${eventSubscriberName}" does not exist`
    ) as any
    error.code = 422
    throw error
  }

  const method = (models[eventSubscriberName] as any)[key]

  if (typeof method !== 'function') {
    throw new TypeError(
      `Model "${eventSubscriberName}" does not implement method "${key}"`
    )
  }
  const middlewareContext = context !== undefined ? context : {}

  return await method(parameters, middlewareContext)
}

const createQuery = (params: CreateQueryOptions): QueryExecutor => {
  const models: WrappedModels = {}

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

  const read = interopApi.bind(null, models, 'read')

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
  }) as QueryExecutor

  return api
}

export { OMIT_BATCH, STOP_BATCH }
export type { CreateQueryOptions }
export default createQuery
