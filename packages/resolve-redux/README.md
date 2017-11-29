# **🔩 resolve-redux** [![npm version](https://badge.fury.io/js/resolve-redux.svg)](https://badge.fury.io/js/resolve-redux)

This package contains tools for integrating reSolve with [Redux](http://redux.js.org/) .
## **📑 Table of Contents**
* [Tools](#-tools)
  * [resolveMiddleware](#resolvemiddleware)
  * [createViewModelsReducer](#createviewmodelsreducer)
  * [withViewModel](#withviewmodel)
  * [graphqlConnector](#graphqlconnector)
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

## 🛠 Tools
### `resolveMiddleware`  
 
  Redux middleware used to:  

  1) Automatically fetch a view model state and subscribe to events. 
  2) Send a command to the server side.

### `createViewModelsReducer`  

  Generates a standard Redux reducer using reSolve view models. It does not take any arguments as it receives required data from [resolve middleware](#resolvemiddleware) automatically.  

  This reducer includes handling the reSolve's [`merge`](#merge) action.

### `withViewModel`  
  A higher-order component (HOC), which automatically subscribes/unsubscribes to/from a view model by aggregateId.

```js
const mapStateToProps = state => ({
	...state[viewModel][aggregateId],
    viewModel, // required field
    aggregateId // required field
});

export default connect(mapStateToProps)(withViewModel(Component));
```

### `graphqlConnector`
  A higher-order component (HOC), which automatically delivers actual state from read model by graphql query. Connector accepts following arguments:
  * `gqlQuery` - GraphQL query for retrieving data from read model.
  * `options` - connector options; see details at [ApolloClient `query` method reference](https://www.apollographql.com/docs/react/reference/index.html#ApolloClient.query).
  * `endpointUrl` - URL address with graphql endpoint for target read model.

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

  A plain object used to send special actions to be automatically handled by [`resolveMiddleware`](#resolvemiddleware). It implements the following functions.
  
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
. It takes two arguments:
    *  `viewModel` -  the name of a read model whose state should be updated  
    *  `aggregateId` - an aggregate id
    *  `state` - the state to be merged with the specified read model's existing state  


## 💻 Basic Usage

### How to Create Redux Store

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
