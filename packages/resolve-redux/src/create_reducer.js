import { MERGE_STATE, REPLACE_STATE } from './actions';

export default function createReducer({ name, eventHandlers }, extendReducer) {
    const handlers = {
        [MERGE_STATE]: (state, { readModelName, state: actionState }) => {
            if (readModelName === name) {
                return state.merge(actionState);
            }
            return state;
        },
        [REPLACE_STATE]: (state, { readModelName, state: actionState }) => {
            if (readModelName === name) {
                return actionState;
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
