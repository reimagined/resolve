import { SUBSCRIBE, UNSUBSCRIBE, SEND_COMMAND } from './action_types';
import actions from './actions';
import defaultSubscribeAdapter from './subscribe_adapter';
import sendCommand from './send_command';
import loadInitialState from './load_initial_state';
import { getKey } from './util';

const REFRESH_TIMEOUT = 1000;

export function getEventTypes(viewModels, subscribers) {
    const eventTypes = {};

    Object.keys(subscribers.viewModels).forEach((viewModelName) => {
        if (!subscribers.viewModels[viewModelName]) {
            return;
        }

        const { Init, ...projection } = viewModels.find(
            ({ name }) => name === viewModelName
        ).projection;

        Object.keys(projection).forEach((eventType) => {
            eventTypes[eventType] = true;
        });
    });

    return Object.keys(eventTypes);
}

export function getAggregateIds(viewModels, subscribers) {
    if (subscribers.aggregateIds['*'] > 0) {
        return '*';
    }

    return Object.keys(subscribers.aggregateIds).filter(
        aggregateId => subscribers.aggregateIds[aggregateId]
    );
}

export async function subscribe(
    store,
    subscribeAdapter,
    viewModels,
    subscribers,
    requests,
    action
) {
    const { viewModelName, aggregateId } = action;

    const needChange =
        !subscribers.viewModels[viewModelName] || !subscribers.aggregateIds[aggregateId];

    subscribers.viewModels[viewModelName] = (subscribers.viewModels[viewModelName] || 0) + 1;
    subscribers.aggregateIds[aggregateId] = (subscribers.aggregateIds[aggregateId] || 0) + 1;

    if (needChange) {
        const key = getKey(viewModelName, aggregateId);
        requests[key] = true;

        const rawState = await loadInitialState(viewModelName, aggregateId);

        const state = viewModels
            .find(({ name }) => name === viewModelName)
            .deserializeState(rawState);

        if (requests[key]) {
            delete requests[key];

            store.dispatch(actions.merge(viewModelName, aggregateId, state));

            subscribeAdapter.setSubscription({
                types: getEventTypes(viewModels, subscribers),
                aggregateIds: getAggregateIds(viewModels, subscribers)
            });
        }
    }
}

export function unsubscribe(store, subscribeAdapter, viewModels, subscribers, requests, action) {
    const { viewModelName, aggregateId } = action;

    subscribers.viewModels[viewModelName] = Math.max(
        (subscribers.viewModels[viewModelName] || 0) - 1,
        0
    );
    subscribers.aggregateIds[aggregateId] = Math.max(
        (subscribers.aggregateIds[aggregateId] || 0) - 1,
        0
    );

    const needChange =
        !subscribers.viewModels[viewModelName] || !subscribers.aggregateIds[aggregateId];

    const key = getKey(viewModelName, aggregateId);
    delete requests[key];

    if (needChange) {
        subscribeAdapter.setSubscription({
            types: getEventTypes(viewModels, subscribers),
            aggregateIds: getAggregateIds(viewModels, subscribers)
        });
    }
}

export function createResolveMiddleware({
    viewModels,
    subscribeAdapter = defaultSubscribeAdapter
}) {
    const subscribers = {
        viewModels: {},
        aggregateIds: {}
    };

    const requests = {};
    const loading = viewModels.reduce((acc, { name }) => {
        acc[name] = {};
        return acc;
    }, {});

    return (store) => {
        store.isLoadingViewModel = (viewModelName, aggregateId) =>
            !!loading[viewModelName][aggregateId];

        store.dispatch(actions.provideViewModels(viewModels));

        const adapter = subscribeAdapter();
        adapter.onEvent(event => store.dispatch(event));
        adapter.onDisconnect(error => store.dispatch(actions.disconnect(error)));

        return next => (action) => {
            switch (action.type) {
                case SUBSCRIBE: {
                    const { viewModelName, aggregateId } = action;
                    loading[viewModelName][aggregateId] = true;

                    subscribe(store, adapter, viewModels, subscribers, requests, action).catch(
                        error =>
                            setTimeout(() => {
                                // eslint-disable-next-line no-console
                                console.error(error);
                                store.dispatch(action);
                            }, REFRESH_TIMEOUT)
                    );

                    break;
                }
                case UNSUBSCRIBE: {
                    const { viewModelName, aggregateId } = action;
                    delete loading[viewModelName][aggregateId];

                    unsubscribe(store, adapter, viewModels, subscribers, requests, action);

                    break;
                }
                case SEND_COMMAND: {
                    sendCommand(store, action);

                    break;
                }
                default:
            }

            return next(action);
        };
    };
}

const middleware =
    typeof window === 'undefined'
        ? () => () => next => action => next(action)
        : createResolveMiddleware;

export default middleware;
