import actions from './actions';
import loadInitialState from './load_initial_state';
import { getEventTypes, getAggregateIds, getKey } from './utils';

const subscribeViewModel = async (
  { origin, rootPath, store, adapter, viewModels, subscribers, requests },
  action
) => {
  const { viewModelName, aggregateId } = action;

  const needChange =
    !subscribers.viewModels[viewModelName] ||
    !subscribers.aggregateIds[aggregateId];

  subscribers.viewModels[viewModelName] =
    (subscribers.viewModels[viewModelName] || 0) + 1;
  subscribers.aggregateIds[aggregateId] =
    (subscribers.aggregateIds[aggregateId] || 0) + 1;

  if (needChange) {
    const key = getKey(viewModelName, aggregateId);
    requests[key] = true;

    const rawState = await loadInitialState(
      {
        origin,
        rootPath
      },
      viewModelName,
      aggregateId
    );

    const state = viewModels
      .find(({ name }) => name === viewModelName)
      .deserializeState(rawState);

    if (requests[key]) {
      delete requests[key];

      store.dispatch(actions.merge(viewModelName, aggregateId, state));

      adapter.setSubscription({
        types: getEventTypes(viewModels, subscribers),
        aggregateIds: getAggregateIds(viewModels, subscribers)
      });
    }
  }
};

export default subscribeViewModel;
