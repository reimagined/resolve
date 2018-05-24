const isLoadingViewModel = (store, viewModelName, aggregateId) => {
  return store.getState.isLoadingViewModel(viewModelName, aggregateId);
};

export default isLoadingViewModel;
