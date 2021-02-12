import { ReadModelDomain } from './types'
import { getReadModelsInteropBuilder } from './get-read-models-interop-builder'
import { validateReadModel } from './validate-read-model'
import { ReadModelMeta } from '../types/runtime'

export const initReadModelDomain = (
  rawReadModels: ReadModelMeta[]
): ReadModelDomain => {
  if (rawReadModels == null) {
    throw Error(`invalid read model meta`)
  }

  const meta = rawReadModels.map(validateReadModel)

  return {
    acquireReadModelsInterop: getReadModelsInteropBuilder(meta),
  }
}
