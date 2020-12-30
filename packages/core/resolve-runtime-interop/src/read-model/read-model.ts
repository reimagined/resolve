import { ReadModelDomain, ReadModelMeta } from './types'
import { getReadModelsInteropBuilder } from './get-read-models-interop-builder'
import { validateReadModel } from './validate-read-model'

export const initReadModelDomain = (
  readModels: ReadModelMeta[]
): ReadModelDomain => {
  if (readModels == null) {
    throw Error(`invalid read model meta`)
  }

  const meta = readModels.map(validateReadModel)

  return {
    acquireReadModelsInterop: getReadModelsInteropBuilder(meta),
  }
}
