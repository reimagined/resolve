const dispose = async ({ viewMap, getKey }, { aggregateIds } = {}) => {
  const modelKey = aggregateIds != null ? getKey(aggregateIds) : null

  const disposingViewModels =
    modelKey != null ? [[modelKey, viewMap.get(modelKey)]] : viewMap.entries()

  for (const [key, viewModel] of disposingViewModels) {
    if (viewModel == null) continue
    viewMap.delete(key)

    viewModel.disposed = true
  }
}

export default dispose
