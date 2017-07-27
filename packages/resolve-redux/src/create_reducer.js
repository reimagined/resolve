import { MERGE } from './actions';

export default function createReducer({ name, eventHandlers }, extendReducer) {
    const handlers = {
        [MERGE]: (state, action) => {
            if (action.readModelName === name) {
                return state.merge(action.state);
            }
            return state;
        },
        ...eventHandlers
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
