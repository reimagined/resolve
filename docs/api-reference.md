---
id: api-reference
title: API Reference
---

## Event Storage

### Adapter Interface

The table below lists functions that should be included into an implementation of a event storage adapter.

| Function Name | Description |
| ------------- | ----------- |
|               |             |

## Read Model Storage

### Adapter Interface

The table below lists functions that should be included into an implementation of a Read Model storage adapter.

| Function Name | Description |
| ------------- | ----------- |
|               |             |

### Store Interface

The table below lists functions that you can use to communicate with a Read Model store through a `store` object.

| Function Name | Description |
| ------------- | ----------- |
|               |             |

## Client-Side API

The reSolve framework includes the client **resolve-redux** library used to connect a client React + Redux app to a reSolve-powered backend. This library provides the following HOCs:

| Function Name                                     | Description                                                                                                      |
| ------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| [connectViewModel](#connectviewmodel)             | Connects a React component to a reSolve View Model.                                                              |
| [connectReadModel](#connectreadmodel)             | Connects a React component to a reSolve Read Model.                                                              |
| [connectRootBasedUrls](#connectrootbasedurls)     | Fixes URLs passed to the specified props so that they take into respect the correct root folder path.            |
| [connectStaticBasedUrls](#connectstaticbasedurls) | Fixes URLs passed to the specified props so that they take into respect the correct static resource folder path. |

### connectViewModel

```js
export const mapStateToOptions = (state, ownProps) => {
  const aggregateId = ownProps.match.params.id

  return {
    viewModelName: 'ShoppingList',
    aggregateIds: [aggregateId]
  }
}

export const mapStateToProps = (state, ownProps) => {
  const aggregateId = ownProps.match.params.id

  return {
    aggregateId
  }
}

export const mapDispatchToProps = (dispatch, { aggregateActions }) =>
  bindActionCreators(
    {
      ...aggregateActions,
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

### connectReadModel

```js
export const mapStateToOptions = () => ({
  readModelName: 'ShoppingLists',
  resolverName: 'all',
  resolverArgs: {}
})

export const mapStateToProps = (state, ownProps) => ({
  lists: ownProps.data
})

export const mapDispatchToProps = (dispatch, { aggregateActions }) =>
  bindActionCreators(aggregateActions, dispatch)

export default connectReadModel(mapStateToOptions)(
  connect(
    mapStateToProps,
    mapDispatchToProps
  )(MyLists)
)
```

### connectRootBasedUrls

```js
export default connectRootBasedUrls(['href'])(Link)
```

### connectStaticBasedUrls

```js
export default connectStaticBasedUrls(['css', 'favicon'])(Header)
```

## Commands

### Command HTTP API

A command can be sent using HTTP API.

For instance, to create a new list in the shopping list app:

```sh
$ curl -X POST http://localhost:3000/api/commands/ \
--header "Content-Type: application/json" \
--data '
{
    "aggregateName": "ShoppingList",
    "aggregateId": "12345-new-shopping-list",
    "type": "createShoppingList",
    "payload": {
        "name": "List 1"
    }
}
'
```
