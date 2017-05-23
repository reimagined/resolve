import { MERGE } from './actions';

export default function createReducer({ name, eventHandlers }, extendReducer) {
    const handlers = {
        ...eventHandlers,
        [MERGE]: (state, action) => {
            if (action.projectionName === name) {
                return state.merge(action.state);
            }
            return state;
        }
    };

    return (state = null, action) => {
        const eventHandler = handlers[action.type];

        if (eventHandler) {
            return eventHandler(state, action);
        }

        if (extendReducer) {
            return extendReducer(state, action);
        }

        return state;
    };
}
