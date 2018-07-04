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

  Generates a standard Redux reducer using reSolve view models. This function takes the following arguments:

```js
createViewModelsReducer(viewModels)
```

### `createReadModelsReducer`

  Generates a standard Redux reducer using reSolve read models. This function takes the following arguments:

```js
createReadModelsReducer(readModels)
```

### `createJwtReducer`

  Generates a standard Redux reducer using reSolve JWT. This function  does not take any arguments:

```js
createJwtReducer()
```
  
### `createResolveMiddleware`
  
  Redux middleware used to:

  1) Automatically fetch a view/read model state and subscribe to events.
  2) Send a command to the server side.
  
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
  A higher-order component (HOC), which automatically subscribes/unsubscribes to/from a view model by aggregateIds and fetch a view model state.

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
  A higher-order component (HOC), which automatically subscribes/unsubscribes to/from a read model by resolver name and resolver arguments and fetch a read model state.

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

  Generates Redux actions using a reSolve aggregate. This function uses the reSolve's [`sendCommandRequest`](#sendcommandrequest) action to pass a command from Redux to the server side. Generated actions are named as an aggregate's commands. This function takes two arguments:
  * `aggregate` -  reSolve aggregate
  * `extendActions` - actions to extend or redefine resulting actions

### `action creators`

  * #### `sendCommandRequest`
    Request sending command to the server side. It takes the object with the following required arguments:
    * `commandType`
    * `aggregateId`
    * `aggregateName`
    * `payload`

  * #### `sendCommandSuccess`
    Acknowledge sending command to the server side. It takes the object with the following required arguments:
    * `commandType`
    * `aggregateId`
    * `aggregateName`
    * `payload`

  * #### `sendCommandFailure`
    Refuse sending command to the server side. It takes the object with the following required arguments:
    * `commandType`
    * `aggregateId`
    * `aggregateName`
    * `payload`
    * `error`

  * #### `subscribeTopicRequest`
    Request subscription to topic. It takes the object with the following required arguments:
    * `topicName`
    * `topicId`

  * #### `subscribeTopicSuccess`
    Acknowledge subscription to topic. It takes the object with the following required arguments:
    * `topicName`
    * `topicId`

  * #### `subscribeTopicFailure`
    Refuse subscription to topic. It takes the object with the following required arguments:
    * `topicName`
    * `topicId`
    * `error`

  * #### `unsubscibeTopicRequest`
    Request unsubscription from topic. It takes the object with the following required arguments:
    * `topicName`
    * `topicId`

  * #### `unsubscribeTopicSuccess`
    Acknowledge unsubscription from topic. It takes the object with the following required arguments:
    * `topicName`
    * `topicId`

  * #### `unsubscribeTopicFailure`
    Refuse unsubscription from topic. It takes the object with the following required arguments:
    * `topicName`
    * `topicId`
    * `error`

  * #### `connectViewModel`
    Start watching view model by parameters. It takes the object with the following required arguments:
    * `viewModelName`
    * `aggregateIds`
    * `aggregateArgs`

  * #### `disconnectViewModel`
    Stop watching view model by parameters. It takes the object with the following required arguments:
    * `viewModelName`
    * `aggregateIds`
    * `aggregateArgs`

  * #### `loadViewModelStateRequest`
    Request fetching view model state from the server side. It takes the object with the following required arguments:
    * `viewModelName`
    * `aggregateIds`
    * `aggregateArgs`

  * #### `loadViewModelStateSuccess`
    Acknowledge fetching view model state from the server side. It takes the object with the following required arguments:
    * `viewModelName`
    * `aggregateIds`
    * `aggregateArgs`
    * `state`
    * `aggregateVersionsMap`

  * #### `loadViewModelStateFailure`
    Refuse fetching view model state from the server side. It takes the object with the following required arguments:
    * `viewModelName`
    * `aggregateIds`
    * `aggregateArgs`
    * `error`

  * #### `dropViewModelState`
    Drop view model state. It takes the object with the following required arguments:
    * `viewModelName`
    * `aggregateIds`
    * `aggregateArgs`

  * #### `connectReadModel`
    Start watching read model by parameters. It takes the object with the following required arguments:
    * `readModelName`
    * `resolverName`
    * `resolverArgs`
    * `isReactive`

  * #### `disconnectReadModel`
    Stop watching read model by parameters. It takes the object with the following required arguments:
    * `readModelName`
    * `resolverName`
    * `resolverArgs`
    * `isReactive`

  * #### `loadReadModelStateRequest`
    Request fetching read model resolver result from the server side. If read model is reactive also subscribe to diff topic. It takes the object with the following required arguments:
    * `readModelName`
    * `resolverName`
    * `resolverArgs`
    * `isReactive`
    * `queryId`

  * #### `loadReadModelStateSuccess`
    Acknowledge fetching read model state from the server side. It takes the object with the following required arguments:
    * `readModelName`
    * `resolverName`
    * `resolverArgs`
    * `isReactive`
    * `queryId`
    * `result`
    * `timeToLive`

  * #### `loadReadModelStateFailure`
    Refuse fetching read model state from the server side. It takes the object with the following required arguments:
    * `readModelName`
    * `resolverName`
    * `resolverArgs`
    * `isReactive`
    * `queryId`
    * `error`

  * #### `applyReadModelDiff`
    Modify reactive read model state by diff. It takes the object with the following required arguments:
    * `readModelName`
    * `resolverName`
    * `resolverArgs`
    * `diff`

  * #### `dropReadModelState`
    Drop read model state. It takes the object with the following required arguments:
    * `readModelName`
    * `resolverName`
    * `resolverArgs`

  * #### `stopReadModelSubscriptionRequest`
    Request stopping read model subscription to the server side. It takes the object with the following required arguments:
    * `queryId`

  * #### `stopReadModelSubscriptionSuccess`
    Acknowledge stopping read model subscription to the server side. It takes the object with the following required arguments:
    * `queryId`

  * #### `stopReadModelSubscriptionFailure`
    Refuse stopping read model subscription to the server side. It takes the object with the following required arguments:
    * `queryId`
    * `error`

  * #### `dispatchTopicMessage`
    Dispatch topic message. It takes the object with the following required arguments:
    * `message`

  * #### `hotModuleReplacement`
    Hot module replacement. It takes the object with the following required arguments:
    * `hotModuleReplacementId`
 