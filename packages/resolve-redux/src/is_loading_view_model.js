export default function isLoadingViewModel(store, viewModelName, aggregateId) {
  return store.getState.isLoadingViewModel(viewModelName, aggregateId)
}
