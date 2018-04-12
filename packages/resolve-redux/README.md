# **resolve-redux**
[![npm version](https://badge.fury.io/js/resolve-redux.svg)](https://badge.fury.io/js/resolve-redux)

This package contains tools for integrating reSolve with [Redux](http://redux.js.org/).
## **Table of Contents** 📑
* [Tools](#tools-)
  * [createResolveMiddleware](#createresolvemiddleware)
  * [createViewModelsReducer](#createviewmodelsreducer)
  * [connectViewModel](#connectViewModel)
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
createResolveMiddleware({ [viewModels] [, readModels] [, aggregates] [, subscribeAdapter] })
```

### `createViewModelsReducer`

  Generates a standard Redux reducer using reSolve view models. It does not take any arguments as it receives required data from [createResolveMiddleware](#createresolvemiddleware) automatically.

  This reducer includes handling the reSolve's [`merge`](#merge) action.

### `connectViewModel`
  A higher-order component (HOC), which automatically subscribes/unsubscribes to/from a view model by aggregateId and connects a React component to a Redux store.

```js
const mapStateToProps = (state) => ({
    ...state[viewModelName][aggregateId],
    viewModelName, // required field
    aggregateId // required field
});

const mapDispatchToProps = (dispatch, { aggregateActions }) =>
    bindActionCreators(aggregateActions, dispatch)

export default connect(mapStateToProps, mapDispatchToProps)(Component);
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

  * #### `subscribeViewmodel`

    Subscribes to new server-side events. This function takes two arguments:
     *  `eventTypes` - an array of event types
    *  `aggregateId` - an aggregate id

 * #### `unsubscribeViewmodel`

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
import React from 'react'
import { connectViewModel } from 'resolve-redux'
import { bindActionCreators } from 'redux'

import actions from '../actions'

const viewModelName = 'Todos'
const aggregateId = 'root-id'

const App = ({ todos, createItem, toggleItem, removeItem, aggregateId }) => {
  let newTodo
  return (
    <div>
      <h1>TODO</h1>
      <ol>
        {Object.keys(todos).map(id => (
          <li key={id}>
            <label>
              <input
                type="checkbox"
                checked={todos[id].checked}
                onChange={toggleItem.bind(null, aggregateId, { id })}
              />
              {todos[id].text}
            </label>
            <span onClick={removeItem.bind(null, aggregateId, { id })}>
              {' [x]'}
            </span>
          </li>
        ))}
      </ol>
      <input type="text" ref={element => (newTodo = element)} />
      <button
        onClick={() => {
          createItem(aggregateId, {
            text: newTodo.value,
            id: Date.now()
          })
          newTodo.value = ''
        }}
      >
        Add Todo
      </button>
    </div>
  )
}

const mapStateToProps = state => ({
  viewModelName,
  aggregateId,
  todos: state[viewModelName][aggregateId]
})

const mapDispatchToProps = dispatch => bindActionCreators(actions, dispatch)

export default connectViewModel(mapStateToProps, mapDispatchToProps)(App)

```
