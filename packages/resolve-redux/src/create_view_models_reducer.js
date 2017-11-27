import { MERGE_STATE, SUBSCRIBE, UNSUBSCRIBE, PROVIDE_VIEW_MODELS } from './actions';
import { getKey } from './util';

export function subscribeHandler(subscribers, viewModels, state, { viewModel, aggregateId }) {
    const key = getKey(viewModel, aggregateId);

    if (subscribers[key]) {
        subscribers[key]++;
        return state;
    }

    subscribers[key] = 1;

    return {
        ...state,
        [viewModel]: {
            ...state[viewModel],
            [aggregateId]: (viewModels.find(({ name }) => viewModel === name).projection.Init ||
                (() => {}))()
        }
    };
}

export function unsubscribeHandler(subscribers, state, { viewModel, aggregateId }) {
    const key = getKey(viewModel, aggregateId);

    if (subscribers[key] > 1) {
        subscribers[key]--;
        return state;
    }

    subscribers[key] = 0;

    const { [aggregateId]: _, ...nextViewModel } = state[viewModel];

    return {
        ...state,
        [viewModel]: nextViewModel
    };
}

export function mergeStateHandler(state, { viewModel, aggregateId, state: actionState }) {
    return {
        ...state,
        [viewModel]: {
            ...state[viewModel],
            [aggregateId]: actionState
        }
    };
}

export function provideViewModelsHandler(
    initialState,
    handlers,
    subscribers,
    state,
    { viewModels }
) {
    delete handlers[PROVIDE_VIEW_MODELS];

    handlers[SUBSCRIBE] = subscribeHandler.bind(null, subscribers, viewModels);

    handlers[UNSUBSCRIBE] = unsubscribeHandler.bind(null, subscribers);

    handlers[MERGE_STATE] = mergeStateHandler;

    viewModels.forEach(({ name: viewModel }) => {
        initialState[viewModel] = {};
    });

    const map = createMap(viewModels);

    Object.keys(map).forEach((eventType) => {
        handlers[eventType] = viewModelEventHandler.bind(null, map, eventType);
    });

    return initialState;
}

export function createMap(viewModels) {
    return viewModels.reduce((acc, { name: viewModel, projection: { Init, ...projection } }) => {
        Object.keys(projection).forEach((eventType) => {
            if (!acc[eventType]) {
                acc[eventType] = {};
            }

            acc[eventType][viewModel] = projection[eventType];
        });
        return acc;
    }, {});
}

export function viewModelEventHandler(map, eventType, state, action) {
    const nextState = { ...state };

    Object.keys(map[eventType]).forEach((viewModel) => {
        if (!state[viewModel]) return;

        if (state[viewModel].hasOwnProperty('*')) {
            const viewModelState = state[viewModel]['*'];

            const result = map[eventType][viewModel](viewModelState, action);

            nextState[viewModel] = {
                ...nextState[viewModel],
                '*': result
            };
        }

        if (!state[viewModel].hasOwnProperty(action.aggregateId)) return;

        const viewModelState = state[viewModel][action.aggregateId];

        const result = map[eventType][viewModel](viewModelState, action);

        nextState[viewModel] = {
            ...nextState[viewModel],
            [action.aggregateId]: result
        };
    });

    return nextState;
}

export default function createViewModelsReducer() {
    const initialState = {};
    const handlers = {};
    const subscribers = {};

    handlers[PROVIDE_VIEW_MODELS] = provideViewModelsHandler.bind(
        initialState,
        handlers,
        subscribers
    );

    return (state = {}, action) => {
        const eventHandler = handlers[action.type];

        if (eventHandler) {
            return eventHandler(state, action);
        }

        return state;
    };
}
