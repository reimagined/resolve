import { createStore, applyMiddleware, combineReducers } from 'redux';
import createSagaMiddleware from 'redux-saga';
import Immutable from 'seamless-immutable';
import { reducer as burgerMenu } from 'redux-burger-menu';

import cardsReducer from '../reducers';
import saga from '../sagas';

const sagaMiddleware = createSagaMiddleware();

const store = createStore(
    combineReducers({ cards: cardsReducer, burgerMenu }),
    { cards: Immutable({ cards: {} }), burgerMenu: { isOpen: false } },
    applyMiddleware(sagaMiddleware)
);

sagaMiddleware.run(saga);

export default store;
