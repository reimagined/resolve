# **🔩 resolve-redux**

This package serves as a helper for creating the Redux storage.

# Basic Usage

## How to create a Redux store

```js
import { createStore, applyMiddleware } from 'redux';
import axios from 'axios';
import {
    createReducer,
    sendCommandMiddleware,
    setSubscriptionMiddleware
} from 'resolve-redux';

const aggregate = {
    name: 'User',
    commands: {
        createUser: (state, { aggregateId, payload }) => ({
            type: 'UserCreated',
            aggregateId,
            payload
        }),
        removeUser: (state, { aggregateId }) => ({
            type: 'UserRemoved',
            aggregateId
        })
    }
};

const readModel = {
    name: 'Users',
    initialState: [],
    eventHandlers: {
        UserCreated(state, event) {
            return state.concat({
                ...event.payload,
                id: event.aggregateId
            });
        },
        UserRemoved(state, event) {
            return state.filter(item =>
                item.id !== event.aggregateId
            );
        }
    }
};

const reducer = createReducer(readModel);

const store = createStore(
    reducer,
    readModel.initialState,
    applyMiddleware(
        sendCommandMiddleware({
            sendCommand: command => axios.post('/api/commands', command)
        }),
        setSubscriptionMiddleware({
            rootDirPath: '/'
        })
    )
);
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
            type: 'TodoListItemAdd',
        },
    };
}

store.dispatch(sendCommandAddTodoItem('aggregateId'));
// or
store.dispatch(actions.sendCommand({
    aggregateId: 'aggregateId',
    aggregateName: 'TodoList',
    payload: { name: 'todo-list' },
    command: {
        type: 'TodoListItemRemove',
    },
}));
```

# Advanced Usage

## Support for Optimistic Updates
```js

const readModel = {
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

const reducer = createReducer(readModel, (state, action) => {
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
