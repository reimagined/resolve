import { MERGE } from './actions';

export default function reducer(projection, projectionName) {
    const _projection = Object.assign({}, projection, {
        [MERGE]: (state, action) => {
            if (action.projectionName === projectionName) {
                return state.merge(action.state);
            }
            return state;
        }
    });
    const _reducer = (state = projection.initialState(), action) => {
        const eventHandler = _projection.eventHandlers[action.type];
        if (eventHandler) {
            return eventHandler(state, action);
        }
        return state;
    };
    return _reducer;
}
