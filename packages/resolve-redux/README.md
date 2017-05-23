# `resolve-redux`

This package serves as a helper for Redux store creation.

## How to create a redux store

```js
import { createStore, applyMiddleware } from 'redux';
import createSagaMiddleware from 'redux-saga';
import { createReducer, saga, actions } from 'resolve-redux';

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

sagaMiddleware.run(saga, {
    sendCommand: command => fetch('/api/commands', {
        method: 'POST', 
        headers: { 'Content-Type': 'application/json' },
        body: command
    }).then( res => res.json() ),
    fetchMore: (projectionName, query) => fetch(`/api/${projectionName}?${getQueryString(query)}` , {
        method: 'GET', 
        headers: { 'Content-Type': 'application/json' },
        body: command
    }).then( res => res.json() ),
});

function getQueryString(params) {
    return Object
    .keys(params)
    .map(k => {
        if (Array.isArray(params[k])) {
            return params[k]
                .map(val => `${encodeURIComponent(k)}[]=${encodeURIComponent(val)}`)
                .join('&')
        }

        return `${encodeURIComponent(k)}=${encodeURIComponent(params[k])}`
    })
    .join('&')
}
```

## How to send the command for the server and to process result
#### Send the command
```js
import { actions } from 'resolve-redux';

export function sendCommandAddTodoItem(aggregateId) {
    return {
        type: 'SEND_COMMAND_ADD_TODO_ITEM',
        aggregateId,
        aggregateName: 'TodoList',
        payload: { name: 'todo-list' },
        command: {
            type: 'TodoListItemAdded',
        },
    }
}

store.dispatch(sendCommandAddTodoItem)
// or
store.dispatch(sendCommand({
    command: {
        type: 'TodoListItemRemoved',
    }, 
    aggregateId: 'aggregateId', 
    aggregateName: 'TodoList', 
    payload: { name: 'todo-list' },
}))
```

#### Process result
```js

// Problem

```