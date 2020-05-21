---
id: frontend
title: Frontend
---

This document describes approaches that you can use to implement a frontend for a reSolve application. The following approaches are available:

- [HTTP API](#http-api) - An HTTP API exposed by a reSolve server
- [resolve-client library](#resolve-client-library) - A higher-level JavaScript library used to communicate with a reSolve server
- [resolve-redux library](#resolve-redux-library) - A library used to connect React + Redux component to reSolve
- [resolve-react-hooks library](#resolve-react-hooks-library) - A hook-based library used to connect React components to reSolve

## HTTP API

A reSolve exposes HTTP API that you can use to send aggregate commands and query Read Models. The following endpoints are available.

| Purpose            | Endpoint                                                    |
| ------------------ | ----------------------------------------------------------- |
| Send a command     | `http://{host}:{port}/api/commands`                         |
| Query a Read Model | `http://{host}:{port}/api/query/{readModel}/{resolver}`     |
| Query a View Model | `http://{host}:{port}/api/query/{viewModel}/{aggregateIds}` |

### Example

> To test the provided console inputs on your machine, download and run the [Shopping List](https://github.com/reimagined/resolve/tree/master/examples/shopping-list) example project.

1. Create a new shopping list named "List 1":

```sh
$ curl -i http://localhost:3000/api/commands/ \
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


HTTP/1.1 200 OK
X-Powered-By: Express
Content-Type: text/html; charset=utf-8
Content-Length: 2
ETag: W/"2-nOO9QiTIwXgNtWtBJezz8kv3SLc"
Date: Tue, 02 Oct 2018 11:47:53 GMT
Connection: keep-alive

OK
```

2. Query a View Model to see the shopping list:

```sh
$ curl -i -g -X GET "http://localhost:3000/api/query/ShoppingList/12345-new-shopping-list"

HTTP/1.1 200 OK
X-Powered-By: Express
Content-Type: text/html; charset=utf-8
Content-Length: 58
ETag: W/"3a-jyqRShDvCZnc9uCOPi31BlQFznA"
Date: Tue, 02 Oct 2018 12:11:43 GMT
Connection: keep-alive

{"id":"12345-new-shopping-list","name":"List 1","list":[]}
```

3. Add an item to the shopping list:

```sh
$ curl -i http://localhost:3000/api/commands/ \
--header "Content-Type: application/json" \
--data '
{
    "aggregateName": "ShoppingList",
    "aggregateId": "12345-new-shopping-list",
    "type": "createShoppingItem",
    "payload": {
        "id": "1",
        "text": "Beer"
    }
}
'

HTTP/1.1 200 OK
X-Powered-By: Express
Content-Type: text/html; charset=utf-8
Content-Length: 2
ETag: W/"2-nOO9QiTIwXgNtWtBJezz8kv3SLc"
Date: Tue, 02 Oct 2018 12:13:39 GMT
Connection: keep-alive

OK
```

4. Add another item:

```sh
$ curl -i http://localhost:3000/api/commands/ \
--header "Content-Type: application/json" \
--data '
{
    "aggregateName": "ShoppingList",
    "aggregateId": "12345-new-shopping-list",
    "type": "createShoppingItem",
    "payload": {
        "id": "2",
        "text": "Chips"
    }
}
'
```

5. Now you can query the view model again and see the items you have added:

```sh
$ curl --g -X GET "http://localhost:3000/api/query/ShoppingList/12345-new-shopping-list" '
HTTP/1.1 200 OK
X-Powered-By: Express
Content-Type: text/html; charset=utf-8
Content-Length: 140
ETag: W/"8c-rWsIpzFOfkV3y9g6x9FlenTaG/A"
Date: Tue, 02 Oct 2018 12:17:57 GMT
Connection: keep-alive

{"id":"12345-new-shopping-list","name":"List 1","list":[{"id":"1","text":"Beer","checked":false},{"id":"2","text":"Chips","checked":false}]}
```

Below you can see the newly created list and its items on the Shopping List application's page.

![List1-items](assets/curl/list1-items.png)

For more information on the HTTP API, refer to the [API Reference](api-reference.md#http-api) topic.

You can extend a reSolve server's API with API Handlers. Refer to the [API Handlers](api-handlers.md) topic for more information.

## resolve-client library

The **resolve-client** library provides an interface that you can use to communicate with reSolve backend from JavaScript code. To initialize the client, call the library's `getClient` function. This function takes a reSolve context as a parameter and returns an initialized client object. This object exposes the following functions:

| Function          | Description                                |
| ----------------- | ------------------------------------------ |
| command           | Sends an aggregate command to the backend. |
| query             | Queries a Read Model.                      |
| getStaticAssetUrl | Gets a static file's full URL.             |
| subscribe         | Subscribes to View Model updates.          |
| unsubscribe       | Unsubscribes from View Model updates.      |

The [with-vanilajs](https://github.com/reimagined/resolve/tree/master/examples/with-vanillajs) example application demonstrates how to use the **resolve-client** library to implement a frontend for a reSolve application in pure JavaScript.

## resolve-redux library

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

You can chain the **connectReadModel** or **connectViewModel** function call with the Redux **connect** function call to synchronize the client Redux state with Read Model or View Model data.

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

### Fix URLs

Use the following HOCs to automatically fix URLs passed to a component as props. The resulting URLs take the backend structure into account.

- **connectRootBasedUrls** - Fixes server routs:
  ```js
  export default connectRootBasedUrls(['href'])(Link)
  ```

* **connectStaticBasedUrls** - Fixes static files paths:
  ```js
  export default connectStaticBasedUrls(['css', 'favicon'])(Header)
  ```

### Sending Commands as Redux Actions

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

### Reactive View Models, Event Subscription

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

## resolve-react-hooks library

The **resolve-react-hooks** library provides React hooks that you can use to connect React components to a reSolve backend. The following hooks are provided.

| Hook              | Description                                                             |
| ----------------- | ----------------------------------------------------------------------- |
| useCommand        | Initializes a command that can be passed to the backend                 |
| useCommandBuilder | Allows to generate commands based on input parameters                   |
| useViewModel      | Establishes a WebSocket connection to a reSolve View Model              |
| useQuery          | Allows a component to send queries to a reSolve Red Model or View Model |

The [shopping-list-with-hooks](https://github.com/reimagined/resolve/tree/master/examples/shopping-list-with-hooks) example application demonstrates how to use the **resolve-react-hooks** library to communicate with a reSolve backend.
