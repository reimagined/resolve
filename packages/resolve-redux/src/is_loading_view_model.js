export default function isLoadingViemModel(store, viewModelName, aggregateId) {
    return store.getState.isLoadingViewModel(store, viewModelName, aggregateId);
}
