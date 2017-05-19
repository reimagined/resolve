import { createStore, applyMiddleware } from 'redux';
import createSagaMiddleware from 'redux-saga';
import { cards as cardsProjection } from 'todo-common';

import reducers from '../reducers';
import saga from '../sagas';

const sagaMiddleware = createSagaMiddleware();

const store = createStore(
    reducers,
    cardsProjection.initialState(),
    applyMiddleware(sagaMiddleware)
);

sagaMiddleware.run(saga);

export default store;
