import { MERGE } from './actions';

export default function reducer({ name, eventHandlers }) {
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

        return state;
    };
}
