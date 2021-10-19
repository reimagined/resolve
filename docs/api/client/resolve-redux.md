---
id: resolve-redux
title: '@resolve-js/redux'
description: The reSolve framework includes the client @resolve-js/redux library used to connect a client React + Redux app to a reSolve-powered backend.
---

The reSolve framework includes the client **@resolve-js/redux** library used to connect a client React + Redux app to a reSolve-powered backend. This library includes both React Hooks and Higher-Order Components (HOCs).

## React Hooks

| Function Name                                           | Description                                                                 |
| ------------------------------------------------------- | --------------------------------------------------------------------------- |
| [useReduxCommand](#usereduxcommand)                     | Creates a hook to execute a command.                                        |
| [useReduxReadModel](#usereduxreadmodel)                 | Creates a hook to query a Read Model.                                       |
| [useReduxReadModelSelector](#usereduxreadmodelselector) | Creates a hook to access a Read Model query result.                         |
| [useReduxViewModel](#usereduxviewmodel)                 | Creates a hook to receive a View Model's state updates and reactive events. |
| [useReduxViewModelSelector](#usereduxviewmodelselector) | Creates a hook to access a View Model's current state on the client.        |

### useReduxCommand

Creates a hook to execute a reSolve command.

##### Example

```js
const { execute: toggleItem } = useReduxCommand({
  type: 'toggleShoppingItem',
  aggregateId: shoppingListId,
  aggregateName: 'ShoppingList',
  payload: {
    id: 'shopping-list-id',
  },
})
```

### useReduxReadModel

Creates a hook to query a reSolve Read Model

##### Example

```js
const { request: getLists, selector: allLists } = useReduxReadModel(
  {
    name: 'ShoppingLists',
    resolver: 'all',
    args: {
      filter: 'none',
    },
  },
  []
)

const { status, data } = useSelector(allLists)
```

### useReduxReadModelSelector

Creates a hook to access the result of a Read Model query. Note that this hook provides access to data obtained through `useReduxReadModel` and does not send any requests to the server.

```js
const { request: getLists, selector: allLists } = useReduxReadModel(
  {
    name: 'ShoppingLists',
    resolver: 'all',
    args: {
      filter: 'none',
    },
  },
  [],
  {
    selectorId: 'all-user-lists',
  }
)

const { status, data } = useReduxReadModelSelector('all-user-lists')
```

### useReduxViewModel

Creates a hook to receive a View Model's state updates and reactive events.

```js
const { connect, dispose, selector: thisList } = useReduxViewModel({
  name: 'shoppingList',
  aggregateIds: ['my-list'],
})

const { data, status } = useSelector(thisList)

useEffect(() => {
  connect()
  return () => {
    dispose()
  }
}, [])
```

### useReduxViewModelSelector

Creates a hook to access a view model's local state. This hook queries the View Model's current state on the client and does not send any requests to the server.

```js
const { connect, dispose, selector: thisList } = useReduxViewModel(
  {
    name: 'shoppingList',
    aggregateIds: ['my-list'],
  },
  {
    selectorId: 'this-list',
  }
)

const { data, status } = useReduxViewModelSelector('this-list')
```

## Higher-Order Components

| Function Name                                     | Description                                                                                        |
| ------------------------------------------------- | -------------------------------------------------------------------------------------------------- |
| [connectViewModel](#connectviewmodel)             | Connects a React component to a reSolve View Model.                                                |
| [connectReadModel](#connectreadmodel)             | Connects a React component to a reSolve Read Model.                                                |
| [connectRootBasedUrls](#connectrootbasedurls)     | Fixes URLs passed to the specified props so that they use the correct root folder path.            |
| [connectStaticBasedUrls](#connectstaticbasedurls) | Fixes URLs passed to the specified props so that they use the correct static resource folder path. |

### connectViewModel

Connects a React component to a reSolve View Model.

##### Example

```js
export const mapStateToOptions = (state, ownProps) => {
  const aggregateId = ownProps.match.params.id

  return {
    viewModelName: 'ShoppingList',
    aggregateIds: [aggregateId],
  }
}

export const mapStateToProps = (state, ownProps) => {
  const aggregateId = ownProps.match.params.id

  return {
    aggregateId,
  }
}

export const mapDispatchToProps = (dispatch) =>
  bindActionCreators(
    {
      replaceUrl: routerActions.replace,
    },
    dispatch
  )

export default connectViewModel(mapStateToOptions)(
  connect(mapStateToProps, mapDispatchToProps)(ShoppingList)
)
```

### connectReadModel

Connects a React component to a reSolve Read Model.

##### Example

```js
import { sendAggregateAction } from '@resolve-js/redux'
import { bindActionCreators } from 'redux'

export const mapStateToOptions = () => ({
  readModelName: 'ShoppingLists',
  resolverName: 'all',
  resolverArgs: {},
})

export const mapStateToProps = (state, ownProps) => ({
  lists: ownProps.data,
})

export const mapDispatchToProps = (dispatch) =>
  bindActionCreators(
    {
      createStory: sendAggregateAction.bind(null, 'Story', 'createStory'),
    },
    dispatch
  )

export default connectReadModel(mapStateToOptions)(
  connect(mapStateToProps, mapDispatchToProps)(MyLists)
)
```

### connectRootBasedUrls

Fixes URLs passed to the specified props and ensures they use the correct root folder path.

##### Example

```js
export default connectRootBasedUrls(['href'])(Link)
```

### connectStaticBasedUrls

Fixes URLs passed to the specified props to correct the static resource folder path.

##### Example

```js
export default connectStaticBasedUrls(['css', 'favicon'])(Header)
```
