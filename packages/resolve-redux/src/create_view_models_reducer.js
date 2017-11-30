import { MERGE, SUBSCRIBE, UNSUBSCRIBE, PROVIDE_VIEW_MODELS } from './actions';
import { getKey } from './util';

export function subscribeHandler({ subscribers, viewModels }, state, { viewModel, aggregateId }) {
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

export function unsubscribeHandler({ subscribers }, state, { viewModel, aggregateId }) {
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

export function mergeHandler(_, state, { viewModel, aggregateId, state: actionState }) {
    return {
        ...state,
        [viewModel]: {
            ...state[viewModel],
            [aggregateId]: actionState
        }
    };
}

export function provideViewModelsHandler(context, state, { viewModels }) {
    const { handlers, initialState } = context;
    context.viewModels = viewModels;

    delete handlers[PROVIDE_VIEW_MODELS];

    handlers[SUBSCRIBE] = subscribeHandler.bind(null, context);

    handlers[UNSUBSCRIBE] = unsubscribeHandler.bind(null, context);

    handlers[MERGE] = mergeHandler.bind(null, context);

    viewModels.forEach(({ name: viewModel }) => {
        initialState[viewModel] = {};
    });

    const map = createMap(viewModels);

    Object.keys(map).forEach((eventType) => {
        handlers[eventType] = viewModelEventHandler.bind(null, map[eventType]);
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

export function viewModelEventHandler(viewModels, state, action) {
    const nextState = { ...state };

    Object.keys(viewModels).forEach((viewModel) => {
        if (!state[viewModel]) return;

        if (state[viewModel].hasOwnProperty('*')) {
            const viewModelState = state[viewModel]['*'];

            const result = viewModels[viewModel](viewModelState, action);

            nextState[viewModel] = {
                ...nextState[viewModel],
                '*': result
            };
        }

        if (!state[viewModel].hasOwnProperty(action.aggregateId)) return;

        const viewModelState = state[viewModel][action.aggregateId];

        const result = viewModels[viewModel](viewModelState, action);

        nextState[viewModel] = {
            ...nextState[viewModel],
            [action.aggregateId]: result
        };
    });

    return nextState;
}

export default function createViewModelsReducer() {
    const context = {
        initialState: {},
        handlers: {},
        subscribers: {}
    };

    context.handlers[PROVIDE_VIEW_MODELS] = provideViewModelsHandler.bind(null, context);

    return (state = {}, action) => {
        const eventHandler = context.handlers[action.type];

        if (eventHandler) {
            return eventHandler(state, action);
        }

        return state;
    };
}
