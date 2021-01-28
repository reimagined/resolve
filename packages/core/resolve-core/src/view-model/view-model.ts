import { ViewModelDomain } from './types'
import { getViewModelsInteropBuilder } from './get-view-models-interop-builder'
import { validateViewModel } from './validate-view-model'
import { ViewModelMeta } from '../types'

export const initReadModelDomain = (
  rawViewModels: ViewModelMeta[]
): ViewModelDomain => {
  if (rawViewModels == null) {
    throw Error(`invalid view model meta`)
  }

  const meta = rawViewModels.map(validateViewModel)

  return {
    acquireViewModelsInterop: getViewModelsInteropBuilder(meta),
  }
}
