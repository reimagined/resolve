---
id: frontend
title: Frontend
---

## React/Redux Support

### resolve-redux library

The reSolve framework includes the client **resolve-redux** library used to connect a client React + Redux app to a reSolve-powered backend.

The **redux** configuration section specifies the following settings related to the frontend:

- **store** - Specifies the file containing the Redux store definition.
- **reducers** - Specifies the file containing the Redux reducer definition.
- **middlewares** - Specifies the file containing the Redux middleware definitions.

Based on these settings, reSolve generates client code to facilitate client-server communication:

- Redux actions are generated for all reSolve aggregate commands.
- Auxiliary reducers and middleware are generated to handle these actions and send the corresponding commands to the reSolve backend.

Use the following resolve-redux library's higher order components (HOCs) to connect components to the backend:

- **connectReadModel** - Connects a component to a Read Model.
- **connectViewModel** - Connects a component to a View Model.

A connected component receives additional props. These props provide access to the Read Model data and Redux action creators mapped to reSolve commands.

### Obtain View Model Data

The code sample below demonstrates how to obtain data from a reSolve backend in the most basic use-case scenario:

```js
import { connectViewModel } from 'resolve-redux'

import React from 'react'
...
const TodoList = ({ data }) => (
  <ul>
    {data.map(i => ( // Access View Model data via the data prop
      <li>{i}</li>
    ))}
  </ul>

export const mapStateToOptions = () => {
  return {
    viewModelName: 'TodoList',
    aggregateIds: ["root-id"]
  }
}

export default connectViewModel(mapStateToOptions)(TodoList)

```

In this code, the **connectViewModel** HOC is used to connect a React component to an existing View Model. The **mapStateToOptions** function specifies the connection options. The following options are required:

- **viewModelName** - the name of a View Model to bind to
- **aggregateIds** - an array of aggregate IDs for which to obtain data

A component connected to a View Model can access the View Model data through the **data** prop.

### Connect to Redux

You can chain the **connectReadModel** or **connectViewModel** function call with the Redux **connect** function call to synchronize the client Rudux state with Read Model or View Model data.

<!-- prettier-ignore-start -->

[embedmd]:# (..\..\examples\shopping-list\client\containers\MyLists.js /export const mapStateToOptions/ /^\)/)
```js
import { sendAggregateAction } from 'resolve-redux'
import { bindActionCreators } from 'redux'

export const mapStateToOptions = () => ({
  readModelName: 'ShoppingLists',
  resolverName: 'all',
  resolverArgs: {}
})

export const mapStateToProps = state => ({
  lists: state.optimisticShoppingLists || []
})

export const mapDispatchToProps = dispatch =>
  bindActionCreators({
    createStory: sendAggregateAction.bind(null, 'Story', 'createStory')
  }, dispatch)

export default connectReadModel(mapStateToOptions)(
  connect(
    mapStateToProps,
    mapDispatchToProps
  )(MyLists)
)
```

<!-- prettier-ignore-end -->

#### Fix URLs

Use the following HOCs to automatically fix URLs passed to a component as props. The resulting URLs take the backend structure into account.

- **connectRootBasedUrls** - Fixes server routs:
  ```js
  export default connectRootBasedUrls(['href'])(Link)
  ```

* **connectStaticBasedUrls** - Fixes static files paths:
  ```js
  export default connectStaticBasedUrls(['css', 'favicon'])(Header)
  ```

## Sending Commands as Redux Actions

A component connected to a Read Model receives an object containing available command names. You can use the **redux.bindActionCreators** function to automatically wrap all these commands into **dispatch** function calls. This allows for a compact implementation of the **mapDispatchToProps** function.

After this, you can dispatch aggregate commands using the corresponding props:

<!-- prettier-ignore-start -->

[embedmd]:# (..\..\examples\shopping-list\client\containers\MyLists.js /class MyLists/ /^\}/)
```js
class MyLists extends React.PureComponent {
  render() {
    const { lists, createShoppingList, removeShoppingList } = this.props

    return (
      <div className="example-wrapper">
        <ShoppingLists lists={lists} removeShoppingList={removeShoppingList} />
        <ShoppingListCreator
          lists={lists}
          createShoppingList={createShoppingList}
        />
      </div>
    )
  }
}
```

<!-- prettier-ignore-end -->

## Reactive View Models, Event Subscription

A View Model is a special kind of a Read Model. Its projection is declared in a universal format so it can also serve as the reducer code on the client side. Events are automatically sent to the client through a WebSocket connection. Because of these properties, View Models are reactive. This means that a component connected to a View Model using the **connectViewModel** method automatically reflects the Read Model changes on the server side, without the need to implement any additional logic.

<!-- prettier-ignore-start -->

[embedmd]:# (..\..\examples\shopping-list\client\containers\ShoppingList.js /export const mapStateToOptions/ /^\)/)
```js
import { sendAggregateAction } from 'resolve-redux'
import { bindActionCreators } from 'redux'

export const mapStateToOptions = (state, ownProps) => {
  const aggregateId = ownProps.match.params.id

  return {
    viewModelName: 'shoppingList',
    aggregateIds: [aggregateId]
  }
}

export const mapStateToProps = (state, ownProps) => {
  const aggregateId = ownProps.match.params.id

  return {
    aggregateId
  }
}

export const mapDispatchToProps = (dispatch) =>
  bindActionCreators(
    {
      createStory: sendAggregateAction.bind(null, 'Story', 'createStory'),
      replaceUrl: routerActions.replace
    },
    dispatch
  )

export default connectViewModel(mapStateToOptions)(
  connect(
    mapStateToProps,
    mapDispatchToProps
  )(ShoppingList)
)
```

<!-- prettier-ignore-end -->

## Optimistic Commands

You can add **optimistic UI updating** functionality to enhance a component's responsiveness if this component is connected to a reSolve ReadModel. With this approach, a component applies model changes on the client side before synchronizing them with the server via an aggregate command.

Use the following steps to implement optimistic UI updating:

1. Create Redux actions that perform updates:

<!-- prettier-ignore-start -->

[embedmd]:# (..\..\examples\shopping-list\client\actions\optimistic_actions.js /^/ /\n$/)

```js
export const OPTIMISTIC_CREATE_SHOPPING_LIST = 'OPTIMISTIC_CREATE_SHOPPING_LIST'
export const OPTIMISTIC_REMOVE_SHOPPING_LIST = 'OPTIMISTIC_REMOVE_SHOPPING_LIST'
export const OPTIMISTIC_SYNC = 'OPTIMISTIC_SYNC'
```

<!-- prettier-ignore-end -->

2. Implement an optimistic reducer function that responds to these commands to update the corresponding slice of the Redux state:

<!-- prettier-ignore-start -->

[embedmd]:# (..\..\examples\shopping-list\client\reducers\optimistic_shopping_lists.js /^/ /\n$/)

```js
import { LOCATION_CHANGE } from 'react-router-redux'
import {
  OPTIMISTIC_CREATE_SHOPPING_LIST,
  OPTIMISTIC_REMOVE_SHOPPING_LIST,
  OPTIMISTIC_SYNC
} from '../actions/optimistic_actions'

const optimistic_shopping_lists = (state = [], action) => {
  switch (action.type) {
    case LOCATION_CHANGE: {
      return []
    }
    case OPTIMISTIC_CREATE_SHOPPING_LIST: {
      return [
        ...state,
        {
          id: action.payload.id,
          name: action.payload.name
        }
      ]
    }
    case OPTIMISTIC_REMOVE_SHOPPING_LIST: {
      return state.filter(item => {
        return item.id !== action.payload.id
      })
    }
    case OPTIMISTIC_SYNC: {
      return action.payload.originalLists
    }
    default: {
      return state
    }
  }
}

export default optimistic_shopping_lists
```

<!-- prettier-ignore-end -->

3. Implement an optimistic middleware to intercept actions used to communicate with a Read Model and update the Redux state accordingly:

<!-- prettier-ignore-start -->

[embedmd]:# (..\..\examples\shopping-list\client\middlewares\optimistic_shopping_lists_middleware.js /^/ /\n$/)

```js
import { actionTypes } from 'resolve-redux'

import {
  OPTIMISTIC_CREATE_SHOPPING_LIST,
  OPTIMISTIC_REMOVE_SHOPPING_LIST,
  OPTIMISTIC_SYNC
} from '../actions/optimistic_actions'

const { SEND_COMMAND_SUCCESS, LOAD_READMODEL_STATE_SUCCESS } = actionTypes

const optimistic_shopping_lists_middleware = store => next => action => {
  if (
    action.type === SEND_COMMAND_SUCCESS &&
    action.commandType === 'createShoppingList'
  ) {
    store.dispatch({
      type: OPTIMISTIC_CREATE_SHOPPING_LIST,
      payload: {
        id: action.aggregateId,
        name: action.payload.name
      }
    })
  }
  if (
    action.type === SEND_COMMAND_SUCCESS &&
    action.commandType === 'removeShoppingList'
  ) {
    store.dispatch({
      type: OPTIMISTIC_REMOVE_SHOPPING_LIST,
      payload: {
        id: action.aggregateId
      }
    })
  }
  if (action.type === LOAD_READMODEL_STATE_SUCCESS) {
    store.dispatch({
      type: OPTIMISTIC_SYNC,
      payload: {
        originalLists: action.result
      }
    })
  }

  next(action)
}

export default optimistic_shopping_lists_middleware
```

<!-- prettier-ignore-end -->

For the full code, refer to the [Shopping List](https://github.com/reimagined/resolve/tree/master/examples/shopping-list) example project.
