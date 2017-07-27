import { createStore, applyMiddleware, combineReducers } from 'redux';
import createSagaMiddleware from 'redux-saga';
import { reducer as burgerMenu } from 'redux-burger-menu';
import { readModels } from 'todo-common';

import cardsReducer from '../reducers';
import saga from '../sagas';

const cardsReadModel = readModels.cards;
const sagaMiddleware = createSagaMiddleware();

const store = createStore(
    combineReducers({ cards: cardsReducer, burgerMenu }),
    { cards: cardsReadModel.initialState, burgerMenu: { isOpen: false } },
    applyMiddleware(sagaMiddleware)
);

sagaMiddleware.run(saga);

export default store;
