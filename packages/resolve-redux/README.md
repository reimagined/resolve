# **resolve-redux**
[![npm version](https://badge.fury.io/js/resolve-redux.svg)](https://badge.fury.io/js/resolve-redux)

This package contains tools for integrating reSolve with [Redux](http://redux.js.org/).
## **Table of Contents** 📑
* [Tools](#tools-)
  * [createResolveMiddleware](#createresolvemiddleware)
  * [createViewModelsReducer](#createviewmodelsreducer)
  * [connect](#connect)
  * [graphqlConnector](#graphqlconnector)
  * [createActions](#createactions)
  * [actions](#actions)
    * [sendCommand](#sendcommand)
    * [subscribe](#subscribe)
    * [unsubscribe](#unsubscribe)
    * [merge](#merge)
* [Basic Usage](#basic-usage-)
  * [How to Create Redux Store](#how-to-create-redux-store)
  * [How to Generate Action from Aggregate](#how-to-generate-actions-from-aggregate)
  * [How to Send Commands to Server](#how-to-send-command-to-server)

## Tools 🛠
### `createResolveMiddleware`  
 
  Redux middleware used to:  

  1) Automatically fetch a view model state and subscribe to events. 
  2) Send a command to the server side.
  
  This function takes the following arguments:

```js
createResolveMiddleware({ viewModels [, subscribeAdapter] })
```   

### `createViewModelsReducer`  

  Generates a standard Redux reducer using reSolve view models. It does not take any arguments as it receives required data from [createResolveMiddleware](#createresolvemiddleware) automatically.  

  This reducer includes handling the reSolve's [`merge`](#merge) action.

### `connect`  
  A higher-order component (HOC), which automatically subscribes/unsubscribes to/from a view model by aggregateId and connects a React component to a Redux store.

```js
const mapStateToProps = state => ({
    ...state[viewModelName][aggregateId],
    viewModelName, // required field
    aggregateId // required field
});

export default connect(mapStateToProps)(Component);
```

### `graphqlConnector`
  A higher-order component (HOC), which automatically delivers a view model's actual state by a graphql query. A connector takes the following arguments:
  * `gqlQuery` - a GraphQL query for retrieving data from a read model
  * `options` - connector options (see ApolloClient's [`query`](https://www.apollographql.com/docs/react/reference/index.html#ApolloClient.query) method  for details)
  * `endpointUrl` - a URL address with a graphql endpoint for a target read model

```js
const ConnectedStoryComponent = gqlConnector(
  `query($id: ID!) {
    story($id: ID!) {
      id
      text
    }
  }`,
  {
    options: ({ storyId }) => ({
      variables: {
        id: storyId
      },
      fetchPolicy: 'network-only'
    })
  },
  '/api/query/graphql'
)(StoryComponent)
```

### `createActions`   

  Generates Redux actions using a reSolve aggregate. This function uses the reSolve's [`sendCommand`](#sendcommand) action to pass a command from Redux to the server side. Generated actions are named as an aggregate's commands. This function takes two arguments:
  * `aggregate` -  reSolve aggregate 
  * `extendActions` - actions to extend or redefine resulting actions

### `actions`  

  A plain object used to send special actions to be automatically handled by [`createResolveMiddleware`](#resolvemiddleware). It implements the following functions.
  
  * #### `sendCommand`  
    Sends a command to the server side. It takes the object with the following required arguments:  
    *  `command` 
    *  `aggregateId` 
    *  `aggregateName`
    *  `payload`
        
  * #### `subscribe`  
  
    Subscribes to new server-side events. This function takes two arguments:
     *  `eventTypes` - an array of event types
    *  `aggregateId` - an aggregate id

 * #### `unsubscribe`  
  
    Unsubscribes from provided server-side events. This function takes two arguments:
    *  `eventTypes` - an array of event types
    *  `aggregateId` - an aggregate id


 * #### `merge`  
    
    Produces an action handled by a reducer which the [`createViewModelsReducer`](#createviewmodelsreducer) function generates. A view model state is replaced with a new state
. It takes three arguments:
    *  `viewModelName` -  the name of a view model whose state should be updated  
    *  `aggregateId` - an aggregate id
    *  `state` - the state to be merged with the specified view model's existing state  


## Basic Usage 💻

### How to Create Redux Store

  ``` js
import { createStore, applyMiddleware } from 'redux';
import { createResolveMiddleware } from 'resolve-redux';
import reducer from '../reducers';
import viewModels from '../../common/view-models';

const middleware = [createResolveMiddleware(viewModels)];

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
