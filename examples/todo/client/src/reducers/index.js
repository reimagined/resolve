import Immutable from 'seamless-immutable';

import cardsReducer from './cards';

function createReducer(handlers) {
    const resultHandlers = Object.assign(
        {
            stateSet: (_, action) => Immutable(action.state)
        },
        handlers
    );

    return (state = {}, action) => {
        const handler = resultHandlers[action.type];
        return handler ? handler(state, action) : state;
    };
}

export default createReducer(cardsReducer);
