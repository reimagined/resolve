# **🔩 resolve-redux** [![npm version](https://badge.fury.io/js/resolve-redux.svg)](https://badge.fury.io/js/resolve-redux)

This package contains tools for integrating reSolve with [Redux](http://redux.js.org/) .
## **📑 Table of Contents**
* [Tools](#-tools)
	* [sendCommandMiddleware](#sendcommandmiddleware)
	* [setSubscriptionMiddleware](#setsubscriptionmiddleware)
	* [createReducer](#createreducer)
	* [createActions](#createactions)
	* [actions](#actions)
		* [merge](#merge)
		* [sendCommand](#sendcommand)
		* [setSubscription](#setsubscription)
		* [replaceState](#replaceState)
* [Basic Usage](#-basic-usage)
	* [How to Create Redux Store](#how-to-create-redux-store)
	* [How to Generate Action from Aggregate](#how-to-generate-action-from-aggregate)
	* [How to Send Commands to Server](#how-to-send-commands-to-server)
* [Advanced Usage](#-advanced-usage)
	* [Support for Optimistic Updates](#support-for-optimistic-updates)

## 🛠 Tools
* ### `sendCommandMiddleware`   
	Redux middleware used to send a command to the server side. It takes an object with the following field:
	* `sendCommand` - a function used to send a command to the server side. It takes `command` and returns the `Promise` object that is resolved when the server handles the command. If the function is not specified, the command is sent to the `/api/commands` url.

	**Example:**  
	```js
	import axios from 'axios'
	import { createStore, applyMiddleware } from 'redux'
	import { sendCommandMiddleware } from 'resolve-redux'
	import reducer from '../reducers'

	const middleware = [
	  sendCommandMiddleware({
	    sendCommand: async command => axios.post(`${process.env.ROOT_DIR}/api/commands`, command)
	  })
	]

	export default initialState => createStore(reducer, initialState, applyMiddleware(...middleware))
	```

* ### `setSubscriptionMiddleware`  
	Redux middleware used to get events from `bus`.  It is used with [`actions.setSubscription`](#setsubscription) to subscribe to the required event types. It takes an object with the following field:
	* `rootDirPath` - the socket's URL. If it is not specified, it uses the `process.env.ROOT_DIR` value or an empty string. [resolve-scripts](../resolve-scripts/src/template/README.md#environment-variables-to-change-url) pass the `process.env.ROOT_DIR` value.

	**Example:**  
	```js
	import axios from 'axios'
	import { createStore, applyMiddleware } from 'redux'
	import { setSubscriptionMiddleware } from 'resolve-redux'
	import reducer from '../reducers'

	const middleware = [
	  setSubscriptionMiddleware({
	    rootDirPath: '/my-path'
	  })
	]

	export default initialState => createStore(reducer, initialState, applyMiddleware(...middleware))
	```
* ### `createReducer`  
	Generates a standard Redux reducer using a reSolve [read model](../resolve-scripts/src/template#%EF%B8%8F-aggregates-and-read-models). It takes two arguments:
	* `read-model` - a reSolve read model to be converted to a Redux  reducer.
	* `extendReducer` - another reducer to be combined with a new one.

	This reducer includes handling the reSolve's [`merge`](#merge) and [`replaceState`](#replacestate) actions.

* ### `createActions`   
	Generates Redux actions using a reSolve [aggregate](../resolve-scripts/src/template#%EF%B8%8F-aggregates-and-read-models). This function uses the reSolve's [`sendCommand`](#sendcommand) action to pass a command from Redux to the server side. Generated actions are named as an aggregate's commands. This function takes two arguments:
	* `aggregate` -  reSolve aggregate. 
	* `extendActions` - actions to extend or redefine resulting actions.


* ### `actions`  
	A plain object used to send special actions to be handled by other tools. It implements the following functions:
	* #### `merge`  
		Produces an action handled by a reducer which the [`createReducer`](#createreducer) function generates. It takes two arguments:
		* `readModelName` -  the name of a read model whose state should be updated.  
		* `state` - the state to be merged with the specified read model's existing state.  

	* #### `sendCommand`  
		Sends a command to the server side. It takes the object with the following required arguments:  
		* `command` 
		* `aggregateId` 
		* `aggregateName`
		* `payload`
				
		The [`sendCommandMiddleware`](#sendcommandmiddleware) automatically handles this action.

	* #### `setSubscription`  
		Subscribes to new server-side events. This function takes two arguments:
		* `eventTypes` - an array of event types
		* `aggregateIds` - an array of aggregate ids

		Returns an action [`setSubscriptionMiddleware`](#setsubscriptionmiddleware) handles. It is useful to subscribe to new bus events in real-time. 

	* #### `replaceState`  
		Produces an action handled by a reducer which the [`createReducer`](#createreducer) function generates. This function is very similar to [`merge`](#merge), but the specified read model state is replaced with a new state instead of merging. This function takes two arguments:
		* `readModelName` - the name of a read model whose state should be updated. 
		* `state` - the new state to replace the specified read model's existing state.	

## 💻 Basic Usage

### How to Create Redux Store

```js
import { createStore, applyMiddleware } from 'redux'
import axios from 'axios'
import {
  createReducer,
  sendCommandMiddleware,
  setSubscriptionMiddleware
} from 'resolve-redux'

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
}

const readModel = {
  name: 'Users',
  initialState: [],
  projection: {
    UserCreated(state, event) {
      return state.concat({
        ...event.payload,
        id: event.aggregateId
      })
    },
    UserRemoved(state, event) {
      return state.filter(item =>
        item.id !== event.aggregateId
      )
    }
  }
}

const reducer = createReducer(readModel)

const store = createStore(
  reducer,
  readModel.initialState,
  applyMiddleware(
    sendCommandMiddleware({
      sendCommand: command => axios.post('/api/commands', command)
    }),
    setSubscriptionMiddleware({
      rootDirPath: process.env.ROOT_DIR
    })
  )
)
```

### How to Generate Action from Aggregate
```js
import { createActions } from 'resolve-redux'
import { connect, bindActionCreators } from 'redux'

import App from './components/App'

export const aggregate {
  name: 'User',
  commands: {
    createUser: (state, { aggregateId, payload }) => ({
      type: 'UserCreated',
      aggregateId,
      payload
    })
  }
}

export const customActions = {
  deleteAll: () => ({
    type: 'DELETE_ALL'
  })
}

function mapDispatchToProps(dispatch) {
  actions: bindActionCreators(createActions(aggregate, customActions))
}

export default connect(() => {}, mapDispatchToProps)(App)
```

### How to Send Commands to Server
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

## 🖥 Advanced Usage

### Support for Optimistic Updates
```js
const readModel = {
  name: 'TodoList',
  initialState: [],
  projection: {
    TodoListItemUpdateText(state, event) {
      return state.concat({
        ...event.payload,
        id: event.aggregateId
      })
    }
  }
}

const reducer = createReducer(readModel, (state, action) => {
  switch (action.type) {
    case 'SEND_COMMAND_TODO_UPDATE_TEXT': {
      if(!action.command.error) {
        // Optimistic update
        return state.map(item => {
          if(item.id === event.aggregateId) {
            return {
              ...item,
              text: action.payload.text,
              textBeforeOptimisticUpdate: item.text
            }
          }
        })
      } else {
        // Revert optimistic update
        return state.map(item => {
          if(item.id === event.aggregateId) {
            return {
              ...item,
              text: item.textBeforeOptimisticUpdate
            }
          }
        })
      }
    }
    default:
      return state
  }
})

```
