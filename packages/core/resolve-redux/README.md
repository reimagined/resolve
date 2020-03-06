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
* [connectStaticBasedUrls](#connectstaticbasedurls)
* [connectRootBasedUrls](#connectrootbasedurls)
* [createStore](#createstore)
* [createActions](#createactions)
* [jwtProvider](#jwtprovider)
* [innerRef](#innerref)
* [Action Creators](#action-creators)

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

  Generates a [Redux reducer](https://redux.js.org/basics/reducers) using a reSolve JWT. No arguments.

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
import { connectViewModel, sendAggregateAction } from 'resolve-redux'
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
  bindActionCreators({
    commandName: sendAggregateAction.bind(null, 'AggregateName', 'CommandName')
  }, dispatch)

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
import { connectReadModel, sendAggregateAction } from 'resolve-redux'
import { bindActionCreators } from 'redux'

const MyComponent = () => { /* React component implementation */ }

const mapStateToOptions = (state, ownProps) => {
  return {
    readModelName: 'Items',
    resolverName: 'getAllItems',
    resolverArgs: {  }
  }
}

const mapStateToProps = (state, ownProps) => {
  return {
    items: ownProps.data,
  }
}

const mapDispatchToProps = (dispatch, ownProps) =>
  bindActionCreators({
    commandName: sendAggregateAction.bind(null, 'AggregateName', 'CommandName')
  }, dispatch)

export default connectReadModel(mapStateToOptions)(
  connect(
    mapStateToProps,
    mapDispatchToProps
  )(MyComponent)
)
```

### `connectRootBasedUrls`
A higher-order component (HOC), used to automatically fixes server routes.

```js
import React from 'react'
import { connectRootBasedUrls } from 'resolve-redux'

const Form = connectRootBasedUrls(['action'])('form')

const Markup = () => (
  <div>
    <From method="POST" action={action}>
      username: <input type="text" name="username" />
      <input type="submit" value="Submit" />
    </From>
  </div>
)

export default Markup
```

See also: [`innerRef`](#innerref).

### `connectStaticBasedUrls`
A higher-order component (HOC), used to automatically fixes paths for static files.

```js
import React from 'react'
import { Image as BootstrapImage } from 'react-bootstrap'
import { connectStaticBasedUrls } from 'resolve-redux'

const Image = connectStaticBasedUrls(['src'])(BootstrapImage)

const Markup = () => (
  <div>
    <Image src="/logo.png" /> {name}
  </div>
)

export default Markup
```

See also: [`innerRef`](#innerref).

### `innerRef`
Passing a `ref` prop to a connected component will give you an instance of the wrapper, but not to the underlying DOM node. This is due to how refs work. It's not possible to call DOM methods, like `focus`, on our wrappers directly.

To get a ref to the actual, wrapped DOM node, pass the callback to the `innerRef` prop instead.

### `createStore`
  Generates a [Redux store](https://github.com/reduxjs/redux/blob/master/docs/api/Store.md) for a reSolve application. Arguments:

  * `redux: { reducers, middlewares, store }`
  * `viewModels`
  * `readModels`
  * `aggregates`
  * `subscribeAdapter`
  * `history`
  * `origin`
  * `rootPath`
  * `isClient`
  * [`initialState`]
  * [[`jwtProvider`]](#jwtprovider)

### `createActions`

  Generates [Redux actions](https://redux.js.org/basics/actions) using a reSolve aggregate. This function uses [`sendCommandRequest`](#sendcommandrequest) to pass a command from Redux to the server side. The generated actions are named after the aggregate commands. Arguments:
  
  * `aggregate` -  reSolve aggregate
  * `extendActions` - actions to extend or redefine resulting actions
  
### `jwtProvider`
  Example for custom jwtProvider:
```js
import { AsyncStorage } from 'react-native'

const jwtProvider = {
  async get() {
    return (await AsyncStorage.getItem(jwtCookie.name)) || ''
  },
  async set(jwtToken) {
    return AsyncStorage.setItem(jwtCookie.name, jwtToken)
  }
}
```

### Action Creators

  * #### `sendCommandRequest`
    Requests sending a command to the server side. The function takes one argument, which is an object with the following keys:
    * `commandType`
    * `aggregateId`
    * `aggregateName`
    * `payload`

  * #### `sendCommandSuccess`
    Acknowledges sending a command to the server side. The function takes one argument, which is an object with the following keys:
    * `commandType`
    * `aggregateId`
    * `aggregateName`
    * `payload`

  * #### `sendCommandFailure`
    Refuses sending the command to the server side. The function takes one argument, which is an object with the following keys:
    * `commandType`
    * `aggregateId`
    * `aggregateName`
    * `payload`
    * `error`

  * #### `subscribeTopicRequest`
    Requests subscription to a topic. The function takes one argument, which is an object with the following keys:
    * `topicName`
    * `topicId`

  * #### `subscribeTopicSuccess`
    Acknowledges subscription to a topic. The function takes one argument, which is an object with the following keys:
    * `topicName`
    * `topicId`

  * #### `subscribeTopicFailure`
    Refuses subscription to a topic. The function takes one argument, which is an object with the following keys:
    * `topicName`
    * `topicId`
    * `error`

  * #### `unsubscribeTopicRequest`
    Requests unsubscription from a topic. The function takes one argument, which is an object with the following keys:
    * `topicName`
    * `topicId`

  * #### `unsubscribeTopicSuccess`
    Acknowledges unsubscription from a topic. The function takes one argument, which is an object with the following keys:
    * `topicName`
    * `topicId`

  * #### `unsubscribeTopicFailure`
    Refuses unsubscription from a topic. The function takes one argument, which is an object with the following keys:
    * `topicName`
    * `topicId`
    * `error`

  * #### `connectViewModel`
    Subscribes to a View Model change. The function takes one argument, which is an object with the following keys:
    * `viewModelName`
    * `aggregateIds`
    * `aggregateArgs`

  * #### `disconnectViewModel`
    Unsubscribes from View Model changes. The function takes one argument, which is an object with the following keys:
    * `viewModelName`
    * `aggregateIds`
    * `aggregateArgs`

  * #### `loadViewModelStateRequest`
    Requests a View Model from the server side. The function takes one argument, which is an object with the following keys:
    * `viewModelName`
    * `aggregateIds`
    * `aggregateArgs`

  * #### `loadViewModelStateSuccess`
    Acknowledges fetching a View Model from the server side. The function takes one argument, which is an object with the following keys:
    * `viewModelName`
    * `aggregateIds`
    * `aggregateArgs`
    * `result`
    * `timestamp`

  * #### `loadViewModelStateFailure`
    Refuses fetching a View Model from the server side. The function takes one argument, which is an object with the following keys:
    * `viewModelName`
    * `aggregateIds`
    * `aggregateArgs`
    * `error`

  * #### `dropViewModelState`
    Clears a View Model. The function takes one argument, which is an object with the following keys:
    * `viewModelName`
    * `aggregateIds`
    * `aggregateArgs`

  * #### `connectReadModel`
    Subscribes to Read Model changes. The function takes one argument, which is an object with the following keys:
    * `readModelName`
    * `resolverName`
    * `resolverArgs`

  * #### `disconnectReadModel`
    Unsubscribes from Read Model changes. The function takes one argument, which is an object with the following keys:
    * `readModelName`
    * `resolverName`
    * `resolverArgs`

  * #### `loadReadModelStateRequest`
    Requests a Read Model Resolver result from the server side. The function takes one argument, which is an object with the following keys:
    * `readModelName`
    * `resolverName`
    * `resolverArgs`
    * `queryId`

  * #### `loadReadModelStateSuccess`
    Acknowledges fetching a Read Model Resolver result from the server side. The function takes one argument, which is an object with the following keys:
    * `readModelName`
    * `resolverName`
    * `resolverArgs`
    * `queryId`
    * `result`
    * `timestamp`

  * #### `loadReadModelStateFailure`
    Refuses fetching a Read Model Resolver result from the server side. The function takes one argument, which is an object with the following keys:
    * `readModelName`
    * `resolverName`
    * `resolverArgs`
    * `queryId`
    * `error`

  * #### `dropReadModelState`
    Clears a Read Model. The function takes one argument, which is an object with the following keys:
    * `readModelName`
    * `resolverName`
    * `resolverArgs`

  * #### `authRequest`
    Requests authorization. It takes the object with the following required arguments:
    * `url`
    * `body`
  
  * #### `authSuccess`
    Acknowledges authorization. The function takes one argument, which is an object with the following keys:
    * `url`
    * `body`

  * #### `authFailure`
    Refuses authorization. The function takes one argument, which is an object with the following keys:
    * `url`
    * `body`
    * `error`  
    
  * #### `updateJwt`
    Sets a jwt. The function takes one argument, which is an object with the following keys:
    * `jwt`
    
  * #### `logout`
    Clears a jwt and logout. No arguments.
    
    export const updateJwt = jwt => ({
      type: UPDATE_JWT,
      jwt
    })    

  * #### `dispatchTopicMessage`
    Dispatches the topic message. The function takes one argument, which is an object with the following keys:
    * `message`

  * #### `hotModuleReplacement`
    Initiates [Hot Module Replacement](https://webpack.js.org/concepts/hot-module-replacement/). The function takes one argument, which is an object with the following keys:
    * `hotModuleReplacementId`
 
