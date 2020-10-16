const deserializeInitialState = (
  viewModels: any[],
  serializedInitialState: any
): any => {
  const initialState = {
    ...serializedInitialState,
    viewModels: {
      ...serializedInitialState.viewModels,
    },
  }

  for (
    let viewModelIndex = 0;
    viewModelIndex < viewModels.length;
    viewModelIndex++
  ) {
    const { name: viewModelName, deserializeState } = viewModels[viewModelIndex]
    const viewModelInitialState = initialState.viewModels[viewModelName]
    for (const aggregateId in viewModelInitialState) {
      if (viewModelInitialState.hasOwnProperty(aggregateId)) {
        viewModelInitialState[aggregateId] = deserializeState(
          viewModelInitialState[aggregateId]
        )
      }
    }
  }

  return initialState
}

export default deserializeInitialState
