import { ViewModelMeta } from '../types'
import {
  ViewModelInterop,
  ViewModelInteropMap,
  ViewModelRuntime,
  ViewModelsInteropBuilder,
} from './types'

const getViewModelInterop = (
  viewModel: ViewModelMeta,
  runtime: ViewModelRuntime
): ViewModelInterop => {
  const { name } = viewModel

  return {
    name,
    acquireResolver: () => Promise.resolve(() => Promise.resolve(null)),
  }
}

export const getViewModelsInteropBuilder = (
  viewModels: ViewModelMeta[]
): ViewModelsInteropBuilder => (runtime) =>
  viewModels.reduce<ViewModelInteropMap>((map, model) => {
    map[model.name] = getViewModelInterop(model, runtime)
    return map
  }, {})
