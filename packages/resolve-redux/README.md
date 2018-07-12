# **resolve-redux**
[![npm version](https://badge.fury.io/js/resolve-redux.svg)](https://badge.fury.io/js/resolve-redux)

This package contains tools for integrating reSolve with [Redux](http://redux.js.org/).
## **Table of Contents** 📑
* [createViewModelsReducer](#createviewmodelsreducer)
* [createReadModelsReducer](#createreadmodelsreducer)
* [createJwtReducer](#createjwtreducer)
* [createResolveMiddleware](#createresolvemiddleware)
* [connectViewModel](#connectviewmodel)
* [connectReadModel](#connectreadmodel)
* [createActions](#createactions)
* [action creators](#action-creators)

### `createViewModelsReducer`

  Generates a [Redux reducer](https://redux.js.org/basics/reducers) from reSolve View Models. Arguments:

```js
createViewModelsReducer(viewModels)
```

### `createReadModelsReducer`

  Generates a [Redux reducer](https://redux.js.org/basics/reducers) using reSolve Read Models. Arguments:

```js
createReadModelsReducer(readModels)
```

### `createJwtReducer`

  Generates a [Redux reducer](https://redux.js.org/basics/reducers) using a reSolve JWT. No arguments:

```js
createJwtReducer()
```

### `createResolveMiddleware`
  
  Redux middleware is used to:

  1. Fetch View and Read Models 
  2. Subscribe to events
  3. Send commands to the server side
  
```js
import { createStore, applyMiddleware, combineReducers } from 'redux'
import { routerReducer, routerMiddleware } from 'react-router-redux'
import {
  createViewModelsReducer,
  createReadModelsReducer,
  createJwtReducer,
  createResolveMiddleware
} from 'resolve-redux'

const resolveMiddleware = createResolveMiddleware()

const store = createStore(
  combineReducers({
    ...reducers,
    router: routerReducer,
    viewModels: createViewModelsReducer(viewModels),
    readModels: createReadModelsReducer(readModels),
    jwt: createJwtReducer()
  }),
  initialState,
  applyMiddleware(
    routerMiddleware(history),
    resolveMiddleware,
    ...middlewares
  )
)

resolveMiddleware.run({
  store,
  viewModels,
  readModels,
  aggregates,
  origin,
  rootPath,
  subscribeAdapter,
  sessionId,
  isClient
})
```

### `connectViewModel`
  A higher-order component (HOC), used to automatically subscribe/unsubscribe to/from View Model updates, and access the aggregate commands by `aggregateIds`.

```js
import { connect } from 'react-redux'
import { connectViewModel } from 'resolve-redux'
import { bindActionCreators } from 'redux'

const MyComponent = () => { /* React component implementation */ }

const mapStateToOptions = (state, ownProps) => ({
  viewModelName,
  aggregateIds
})

const mapStateToProps = (state, ownProps) => ({
  items: ownProps.data
})

const mapDispatchToProps = (dispatch, ownProps) =>
  bindActionCreators(aggregateActions, dispatch)

export default connectViewModel(mapStateToOptions)(
  connect(
    mapStateToProps,
    mapDispatchToProps
  )(MyComponent)
)
```

### `connectReadModel`
  A higher-order component (HOC), used to automatically subscribe/unsubscribe to/from Read Model updates, and access the corresponding aggregate's commands.

```js
import { connect } from 'react-redux'
import { connectReadModel } from 'resolve-redux'
import { bindActionCreators } from 'redux'

const MyComponent = () => { /* React component implementation */ }

const mapStateToOptions = (state, ownProps) => {
  return {
    readModelName: 'Items',
    resolverName: 'getAllItems',
    resolverArgs: {  },
    isReactive: true
  }
}

const mapStateToProps = (state, ownProps) => {
  return {
    items: ownProps.data,
  }
}

const mapDispatchToProps = (dispatch, ownProps) =>
  bindActionCreators(aggregateActions, dispatch)

export default connectReadModel(mapStateToOptions)(
  connect(
    mapStateToProps,
    mapDispatchToProps
  )(MyComponent)
)
```

### `createActions`

  Generates [Redux actions](https://redux.js.org/basics/actions) using a reSolve aggregate. This function uses [`sendCommandRequest`](#sendcommandrequest) to pass a command from Redux to the server side. The generated actions are named after the aggregate commands. Arguments:
  
  * `aggregate` -  reSolve aggregate
  * `extendActions` - actions to extend or redefine resulting actions

### Action Creators

  * #### `sendCommandRequest`
    Request sending command to the server side. The function takes one argument, which is an object with the following keys:
    * `commandType`
    * `aggregateId`
    * `aggregateName`
    * `payload`

  * #### `sendCommandSuccess`
    Acknowledge sending command to the server side. The function takes one argument, which is an object with the following keys:
    * `commandType`
    * `aggregateId`
    * `aggregateName`
    * `payload`

  * #### `sendCommandFailure`
    Refuse sending command to the server side. The function takes one argument, which is an object with the following keys:
    * `commandType`
    * `aggregateId`
    * `aggregateName`
    * `payload`
    * `error`

  * #### `subscribeTopicRequest`
    Request subscription to a topic. The function takes one argument, which is an object with the following keys:
    * `topicName`
    * `topicId`

  * #### `subscribeTopicSuccess`
    Acknowledge subscription to a topic. The function takes one argument, which is an object with the following keys:
    * `topicName`
    * `topicId`

  * #### `subscribeTopicFailure`
    Refuse subscription to a topic. The function takes one argument, which is an object with the following keys:
    * `topicName`
    * `topicId`
    * `error`

  * #### `unsubscribeTopicRequest`
    Request unsubscription from a topic. The function takes one argument, which is an object with the following keys:
    * `topicName`
    * `topicId`

  * #### `unsubscribeTopicSuccess`
    Acknowledge unsubscription from a topic. The function takes one argument, which is an object with the following keys:
    * `topicName`
    * `topicId`

  * #### `unsubscribeTopicFailure`
    Refuse unsubscription from a topic. The function takes one argument, which is an object with the following keys:
    * `topicName`
    * `topicId`
    * `error`

  * #### `connectViewModel`
    Subscribe to a View Model changes. The function takes one argument, which is an object with the following keys:
    * `viewModelName`
    * `aggregateIds`
    * `aggregateArgs`

  * #### `disconnectViewModel`
    Unsubscribe from View Model changes. The function takes one argument, which is an object with the following keys:
    * `viewModelName`
    * `aggregateIds`
    * `aggregateArgs`

  * #### `loadViewModelStateRequest`
    Request a View Model from the server side. The function takes one argument, which is an object with the following keys:
    * `viewModelName`
    * `aggregateIds`
    * `aggregateArgs`

  * #### `loadViewModelStateSuccess`
    Acknowledge fetching a View Model from the server side. The function takes one argument, which is an object with the following keys:
    * `viewModelName`
    * `aggregateIds`
    * `aggregateArgs`
    * `state`
    * `aggregateVersionsMap`

  * #### `loadViewModelStateFailure`
    Refuse fetching a View Model from the server side. The function takes one argument, which is an object with the following keys:
    * `viewModelName`
    * `aggregateIds`
    * `aggregateArgs`
    * `error`

  * #### `dropViewModelState`
    Clear a View Model. The function takes one argument, which is an object with the following keys:
    * `viewModelName`
    * `aggregateIds`
    * `aggregateArgs`

  * #### `connectReadModel`
    Subscribe to a Read Model changes. The function takes one argument, which is an object with the following keys:
    * `readModelName`
    * `resolverName`
    * `resolverArgs`
    * `isReactive`

  * #### `disconnectReadModel`
    Unsubscribe from a Read Model changes. The function takes one argument, which is an object with the following keys:
    * `readModelName`
    * `resolverName`
    * `resolverArgs`
    * `isReactive`

  * #### `loadReadModelStateRequest`
    Request a Read Model Resolver result from the server side. If the Read Model is reactive, this function also subscribes to the `diff` topic. The function takes one argument, which is an object with the following keys:
    * `readModelName`
    * `resolverName`
    * `resolverArgs`
    * `isReactive`
    * `queryId`

  * #### `loadReadModelStateSuccess`
    Acknowledge fetching a Read Model Resolver result from the server side. The function takes one argument, which is an object with the following keys:
    * `readModelName`
    * `resolverName`
    * `resolverArgs`
    * `isReactive`
    * `queryId`
    * `result`
    * `timeToLive`

  * #### `loadReadModelStateFailure`
    Refuse fetching a Read Model Resolver result from the server side. The function takes one argument, which is an object with the following keys:
    * `readModelName`
    * `resolverName`
    * `resolverArgs`
    * `isReactive`
    * `queryId`
    * `error`

  * #### `applyReadModelDiff`
    Modify a reactive Read Model. The function takes one argument, which is an object with the following keys:
    * `readModelName`
    * `resolverName`
    * `resolverArgs`
    * `diff`

  * #### `dropReadModelState`
    Clear a Read Model. The function takes one argument, which is an object with the following keys:
    * `readModelName`
    * `resolverName`
    * `resolverArgs`

  * #### `stopReadModelSubscriptionRequest`
    Request stopping a Read Model subscription. It takes the object with the following required arguments:
    * `queryId`

  * #### `stopReadModelSubscriptionSuccess`
    Acknowledge stopping a Read Model subscription. The function takes one argument, which is an object with the following keys:
    * `queryId`

  * #### `stopReadModelSubscriptionFailure`
    Refuse stopping a Read Model subscription. The function takes one argument, which is an object with the following keys:
    * `queryId`
    * `error`

  * #### `dispatchTopicMessage`
    Dispatch the topic message. The function takes one argument, which is an object with the following keys:
    * `message`

  * #### `hotModuleReplacement`
    Initiate [Hot Module Replacement](https://webpack.js.org/concepts/hot-module-replacement/). The function takes one argument, which is an object with the following keys:
    * `hotModuleReplacementId`
 