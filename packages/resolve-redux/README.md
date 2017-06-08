# `resolve-redux`

This package serves as a helper for creating the Redux storage.

# Basic Usage

## How to create a Redux store

```js
import { createStore, applyMiddleware } from 'redux';
import createSagaMiddleware from 'redux-saga';
import { createReducer, saga, actions } from 'resolve-redux';

const projection = {
    name: 'TodoList',
    initialState: () => [],
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
    projeciton.initialState(),
    applyMiddleware(sagaMiddleware)
);

function sendCommand(command) {
    return fetch('/api/commands', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: command
    }).then( res => res.json() );
}

function fetchMore(projectionName, query) {
    return fetch(`/api/${projectionName}?${getQueryString(query)}` , {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        body: command
    }).then( res => res.json() );
}

sagaMiddleware.run(saga, { sendCommand, fetchMore });

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
        }).join('&');
}
```

## How to generate action from aggregate
```js
import { createActions } from 'resolve-redux';
import { connect, bindActionCreators } from 'redux';

import App from './components/App';

export const aggregate {
    name: 'User',
    commands: {
        createUser: (state, { aggregateId, payload }) => ({
            type: 'UserCreated',
            aggregateId,
            payload
        })
    }
};

export const customActions = {
    deleteAll: () => ({
        type: 'DELETE_ALL'
    })
}

function mapDispatchToProps(dispatch) {
    actions: bindActionCreators(createActions(aggregate, customActions))
}

export default connect(() => {}, mapDispatchToProps)(App);
```

## How to send commands to the server
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
    };
}

store.dispatch(sendCommandAddTodoItem('aggregateId'));
// or
store.dispatch(actions.sendCommand({
    command: {
        type: 'TodoListItemRemoved',
    },
    aggregateId: 'aggregateId',
    aggregateName: 'TodoList',
    payload: { name: 'todo-list' },
}));
```

# Advanced Usage

## Support for Optimistic Updates
```js

const projection = {
    name: 'TodoList',
    initialState: [],
    eventHandlers: {
        TodoListItemUpdateText(state, event) {
            return state.concat({
                ...event.payload,
                id: event.aggregateId
            });
        }
    }
};

const reducer = createReducer(projection, (state, action) => {
    switch (action.type) {
        case 'SEND_COMMAND_TODO_UPDATE_TEXT': {
            // Optimistic update
            if(!action.error) {
                return state.map(item => {
                    if(item.id === event.aggregateId) {
                        return {
                            ...item,
                            text: action.payload.text,
                            textBeforeOptimisticUpdate: item.text
                        };
                    }
                });
            } else {
            // Revert optimistic update
                return state.map(item => {
                    if(item.id === event.aggregateId) {
                        return {
                            ...item,
                            text: item.textBeforeOptimisticUpdate
                        };
                    }
                });
            }
        }
        default:
            return state;
    }
});

```
