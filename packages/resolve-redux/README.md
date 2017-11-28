# **🔩 resolve-redux** [![npm version](https://badge.fury.io/js/resolve-redux.svg)](https://badge.fury.io/js/resolve-redux)

This package contains tools for integrating reSolve with [Redux](http://redux.js.org/) .
## **📑 Table of Contents**
* [Tools](#-tools)
  * [resolveMiddleware](#resolvemiddleware)
  * [createViewModelsReducer](#createviewmodelsreducer)
  * [withViewModel](#withviewmodel)
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
### `resolveMiddleware`  
 
  Redux middleware is using for two purposes: 
  1) Automatically fetch view model state and subscribe on events. 
  2) Send a command to the server side.

### `createViewModelsReducer`  

  Generates a standard Redux reducer using a reSolve view models. It does not take any arguments, because it receives required data from [resolve middleware](#resolvemiddleware) automatically.  

  This reducer includes handling the reSolve's [`merge`](#merge) action.

### `withViewModel`  
The higher-order component (HOC) which automatically subscribe/unsubscribe on view model by aggregateId.

```js
const mapStateToProps = state => ({
	...state[viewModel][aggregateId],
    viewModel, // required field
    aggregateId // required field
});

export default connect(mapStateToProps)(withViewModel(Component));
```

### `createActions`   

  Generates Redux actions using a reSolve aggregate. This function uses the reSolve's [`sendCommand`](#sendcommand) action to pass a command from Redux to the server side. Generated actions are named as an aggregate's commands. This function takes two arguments:
  * `aggregate` -  reSolve aggregate. 
  * `extendActions` - actions to extend or redefine resulting actions.

### `actions`  

  A plain object used to send special actions to be handled by other tools. It implements the following functions:
  
  #### `sendCommand`  
  
  Sends a command to the server side. It takes the object with the following required arguments:  
  *  `command` 
  *  `aggregateId` 
  *  `aggregateName`
  *  `payload`
        
  The [`resolveMiddleware`](#resolvemiddleware) automatically handles this action.

  #### `subscribe`  
  
  Subscribes to new server-side events. This function takes two arguments:
  *  `eventTypes` - an array of event types.
  *  `aggregateId` - an aggregate id.

  #### `unsubscribe`  
  
  Unsubscribes from provided server-side events. This function takes two arguments:
  *  `eventTypes` - an array of event types.
  *  `aggregateId` - an aggregate id.

  #### `merge`  
    
  Produces an action handled by a reducer which the [`createViewModelsReducer`](#createviewmodelsreducer) function generates. View model state is replaced with a new state instead of merging. It takes two arguments:
  *  `viewModel` -  the name of a read model whose state should be updated.  
  *  `aggregateId` - an aggregate id.
  *  `state` - the state to be merged with the specified read model's existing state.  


## 💻 Basic Usage

### How to Create Redux Store


  **Example:**  
  ``` js
import { createStore, applyMiddleware } from 'redux';
import { resolveMiddleware } from 'resolve-redux';
import reducer from '../reducers';
import viewModels from '../../common/view-models';

const middleware = [resolveMiddleware(viewModels)];

export default initialState => createStore(reducer, initialState, applyMiddleware(...middleware));
  ```

### How to Generate Actions from Aggregate
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

function mapDispatchToProps(dispatch) {
  actions: bindActionCreators(createActions(aggregate))
}

export default connect(() => {}, mapDispatchToProps)(App)
```

### How to Send Command to Server
```js
import { actions } from 'resolve-redux';

export function sendCommandAddTodoItem(aggregateId) {
    return {
        type: 'SEND_COMMAND_ADD_TODO_ITEM',
        aggregateId,
        aggregateName: 'TodoList',
        payload: { name: 'todo-list' },
        command: {
            type: 'TodoListItemAdd'
        }
    };
}

store.dispatch(sendCommandAddTodoItem('aggregateId'));
```
or
```js
store.dispatch(actions.sendCommand({
    aggregateId: 'aggregateId',
    aggregateName: 'TodoList',
    payload: { name: 'todo-list' },
    command: {
        type: 'TodoListItemRemove'
    }
}));
```
