import { MERGE_STATE, SUBSCRIBE, UNSUBSCRIBE, PROVIDE_VIEW_MODELS } from './actions';
import { getKey } from './util';

export default function createReducer() {
    const handlers = {};
    const initialState = {};
    const subscribers = {};

    handlers[PROVIDE_VIEW_MODELS] = (state, { viewModels }) => {
        delete handlers[PROVIDE_VIEW_MODELS];

        handlers[SUBSCRIBE] = (state, { viewModel, aggregateId }) => {
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
                    [aggregateId]: viewModels
                        .find(({ name }) => viewModel === name)
                        .projection.Init()
                }
            };
        };

        handlers[UNSUBSCRIBE] = (state, { viewModel, aggregateId }) => {
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
        };

        handlers[MERGE_STATE] = (state, { viewModel, aggregateId, state: actionState }) => {
            return {
                ...state,
                [viewModel]: {
                    ...state[viewModel],
                    [aggregateId]: actionState
                }
            };
        };

        viewModels.forEach(({ name: viewModel }) => {
            initialState[viewModel] = {};
        });

        const map = viewModels.reduce(
            (acc, { name: viewModel, projection: { Init, ...projection } }) => {
                Object.keys(projection).forEach((eventType) => {
                    if (!acc[eventType]) {
                        acc[eventType] = {};
                    }

                    acc[eventType][viewModel] = projection[eventType];
                });
                return acc;
            },
            {}
        );

        Object.keys(map).forEach((eventType) => {
            handlers[eventType] = (state, action) => {
                const nextState = { ...state };

                Object.keys(map[eventType]).forEach((viewModel) => {
                    const viewModelState = state[viewModel][action.aggregateId];

                    const result = map[eventType][viewModel](viewModelState, action);

                    nextState[viewModel] = {
                        ...nextState[viewModel],
                        [action.aggregateId]: result
                    };
                });

                return nextState;
            };
        });

        return state;
    };

    return (state = initialState, action) => {
        const eventHandler = handlers[action.type];

        if (eventHandler) {
            return eventHandler(state, action);
        }

        return state;
    };
}
