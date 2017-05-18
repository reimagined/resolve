import { createStore, applyMiddleware } from 'redux';
import createSagaMiddleware from 'redux-saga';
import Immutable from 'seamless-immutable';

import reducers from '../reducers';
import saga from '../sagas';

const sagaMiddleware = createSagaMiddleware();

const store = createStore(reducers, Immutable({ cards: {} }), applyMiddleware(sagaMiddleware));

sagaMiddleware.run(saga);

export default store;
