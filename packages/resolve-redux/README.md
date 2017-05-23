# `resolve-redux`

This package serves as a helper for Redux store creation.

## Usage

```js
import { createStore, applyMiddleware } from 'redux';
import createSagaMiddleware from 'redux-saga';
import { createReducer, saga, actions } from 'resolve-redux';
import fetch from 'isomorphic-fetch';

const projection = {
    name: 'TodoList',
    initialState: [],
    eventHandlers: {
        TodoListItemAdded(state, event) {
            return state.concat({
                ...event.payload,
                id: event.aggregateId
            });
        },
        TodoListItemRemoved(state, event) {
            return state.filter(item =>
                item.id !== event.aggregateId
            );
        }
    }
};

const reducer = createReducer(projection);
const sagaMiddleware = createSagaMiddleware();

const store = createStore(
    reducer,
    projeciton.initialState,
    applyMiddleware(sagaMiddleware)
);

sagaMiddleware.run(saga);

fetch('/initialState')
    .then(res => res.json())
    .then(data => store.dispatch(actions.merge(data)));
```
