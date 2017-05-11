import { MERGE } from './actions';

export default function reducer(projection) {
    const _projection = Object.assign({}, projection);
    _projection.eventHandlers = Object.assign({}, _projection.eventHandlers, {
        [MERGE]: (state, action) => {
            if (action.projectionName === projection.name) {
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
