---
id: frontend
title: Frontend
---

This document describes approaches that you can use to implement a frontend for a reSolve application. The following approaches are available:

- [HTTP API](#http-api) - An HTTP API exposed by a reSolve server
- [resolve-client library](#resolve-client-library) - A higher-level JavaScript library used to communicate with a reSolve server
- [resolve-redux library](#resolve-redux-library) - A library used to connect a React + Redux component to reSolve
- [resolve-react-hooks library](#resolve-react-hooks-library) - A hook-based library used to connect React components to reSolve

## Client Application Entry Point

### Basic Entry Point

A client script should export a function that is the script's entry point. This function takes the reSolve context as the parameter.

```js
const main = async resolveContext => {
...
}
export default main
```

To register the entry point, assign the path to the file that contains the entry point definition to the `clientEntries` [configuration option](application-configuration.md#cliententries):

```js
clientEntries: ['client/index.js']
```

Use the `resolveContext` object to initialize a client library. The code samples below demonstrate how to configure the entry point for different client libraries.

##### resolve-client:

```js
import { getClient } from 'resolve-client'
const main = async resolveContext => {
  await new Promise(resolve => domready(resolve))
  const client = getClient(resolveContext)
  const { data } = await client.query({
    name: 'chat',
    aggregateIds: '*'
  })
  ...
}
```

##### resolve-redux:

```js
import { AppContainer, createStore, getOrigin } from 'resolve-redux'

const entryPoint = ({
  clientImports,
  rootPath,
  staticPath,
  viewModels,
  subscriber
}) => {
  const origin = getOrigin(window.location)
  const history = createBrowserHistory({ basename: rootPath })
  const routes = getRoutes(clientImports)
  const redux = getRedux(clientImports, history)

  const store = createStore({
    serializedState: window.__INITIAL_STATE__,
    redux,
    viewModels,
    subscriber,
    history,
    origin,
    rootPath,
    staticPath,
    isClient: true
  })

  render(
    <AppContainer
      origin={origin}
      rootPath={rootPath}
      staticPath={staticPath}
      store={store}
      history={history}
    >
      <Router history={history}>
        <Routes routes={routes} />
      </Router>
    </AppContainer>,
    document.getElementById('app-container')
  )
}
```

##### resolve-react-hooks:

```js
import { ResolveContext } from 'resolve-react-hooks'
...
const entryPoint = context => {
  const appContainer = document.createElement('div')
  document.body.appendChild(appContainer)
  render(
    <ResolveContext.Provider value={context}>
      <BrowserRouter>{renderRoutes(routes)}</BrowserRouter>
    </ResolveContext.Provider>,
    appContainer
  )
}
```

### SSR Handlers

To use Server Side Rendering (SSR) in your application, you need to implement one or several handlers that pre-render the client application's markup on the server.

An SSR handler is an asynchronous function that receives the `resolveContext` along with a request and response objects. As the result of its execution, an SSR handler should send a response that contains the rendered markup:

```js
const ssrHandler = async (
  resolveContext,
  req,
  res
) => {
  ...
  const markupHtml = 
    `<!doctype html>` 
      `<html ${helmet.htmlAttributes.toString()}>` +
      ...
      '</html>'
  await res.end(markupHtml)
}
```

To enable server side rendering, specify an array of server side rendering scripts that target different environments in the `clientEntries` configuration section:

```js
clientEntries: [
  'client/index.js',
  [
    'client/ssr.js',
    {
      outputFile: 'common/local-entry/ssr.js',
      moduleType: 'commonjs',
      target: 'node'
    }
  ],
  [
    'client/ssr.js',
    {
      outputFile: 'common/cloud-entry/ssr.js',
      moduleType: 'commonjs',
      target: 'node'
    }
  ]
]
```

For more information on these settings, refer to the [Application Configuration](application-configuration.md#cliententries) article.

To serve SSR markup to the client, you need to register the **live-require-handler.js** API handler in the **apiHandlers** configuration section:

##### config.app.js:

```js
...
apiHandlers: [
  {
    handler: {
      module: 'resolve-runtime/lib/common/handlers/live-require-handler.js',
      options: {
        modulePath: './ssr.js',
        moduleFactoryImport: false
      }
    },
    path: '/:markup*',
    method: 'GET'
  }
],
...
```

## HTTP API

A reSolve exposes HTTP API that you can use to send aggregate commands and query Read Models. The following endpoints are available.

| Purpose            | Endpoint                                                    |
| ------------------ | ----------------------------------------------------------- |
| Send a command     | `http://{host}:{port}/api/commands`                         |
| Query a Read Model | `http://{host}:{port}/api/query/{readModel}/{resolver}`     |
| Query a View Model | `http://{host}:{port}/api/query/{viewModel}/{aggregateIds}` |

#### Example

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

5. You can now query the view model again and see the items you have added:

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

Below, you can see the newly created list and its items on the Shopping List application's page.

![List1-items](assets/curl/list1-items.png)

For more information on the HTTP API, refer to the following help topic: [API Reference](api-reference.md#http-api).

You can extend a reSolve server's API with API Handlers. Refer to the following help topic for more information: [API Handlers](api-handlers.md).

## resolve-client library

The **resolve-client** library provides an interface that you can use to communicate with the reSolve backend from JavaScript code. To initialize the client, call the library's `getClient` function. This function takes a reSolve context as a parameter and returns an initialized client object. This object exposes the following functions:

| Function                                                | Description                                                                 |
| ------------------------------------------------------- | --------------------------------------------------------------------------- |
| [command](api-reference.md#command)                     | Sends an aggregate command to the backend.                                  |
| [query](api-reference.md#query)                         | Queries a Read Model.                                                       |
| [getStaticAssetUrl](api-reference.md#getstaticasseturl) | Gets a static file's full URL.                                              |
| [getOriginPath](api-reference.md#getoriginpath)         | Returns an absolute URL within the application for the given relative path. |
| [subscribe](api-reference.md#subscribe)                 | Subscribes to View Model updates.                                           |
| [unsubscribe](api-reference.md#unsubscribe)             | Unsubscribes from View Model updates.                                       |

#### Example

The [with-vanilajs](https://github.com/reimagined/resolve/tree/master/examples/with-vanillajs) example application demonstrates how to use the **resolve-client** library to implement a frontend for a reSolve application in pure JavaScript.

## resolve-redux library

The reSolve framework includes the client **resolve-redux** library used to connect a client React + Redux app to a reSolve-powered backend.

Use the following resolve-redux library's hooks and Higher-Order Components (HOCs) to connect react components to the backend.

##### React Hooks:

| Function Name                                                           | Description                                                                 |
| ----------------------------------------------------------------------- | --------------------------------------------------------------------------- |
| [useReduxCommand](api-reference.md#usereduxcommand)                     | Creates a hook to execute a command.                                        |
| [useReduxReadModel](api-reference.md#usereduxreadmodel)                 | Creates a hook to query a Read Model.                                       |
| [useReduxReadModelSelector](api-reference.md#usereduxreadmodelselector) | Creates a hook to access a Read Model query result.                         |
| [useReduxViewModel](api-reference.md#usereduxviewmodel)                 | Creates a hook to receive a View Model's state updates and reactive events. |
| [useReduxViewModelSelector](api-reference.md#usereduxviewmodelselector) | Creates a hook to access a View Model's current state on the client.        |

##### Higher-Order Components:

| Function Name                                                     | Description                                                                                        |
| ----------------------------------------------------------------- | -------------------------------------------------------------------------------------------------- |
| [connectViewModel](api-reference.md#connectviewmodel)             | Connects a React component to a reSolve View Model.                                                |
| [connectReadModel](api-reference.md#connectreadmodel)             | Connects a React component to a reSolve Read Model.                                                |
| [connectRootBasedUrls](api-reference.md#connectrootbasedurls)     | Fixes URLs passed to the specified props so that they use the correct root folder path.            |
| [connectStaticBasedUrls](api-reference.md#connectstaticbasedurls) | Fixes URLs passed to the specified props so that they use the correct static resource folder path. |

#### Example

The [shopping-list](https://github.com/reimagined/resolve/tree/master/examples/shopping-list) example application demonstrates how to use the **resolve-client** library to implement a react-redux frontend for a reSolve application.

<!-- prettier-ignore-end -->

## resolve-react-hooks library

The **resolve-react-hooks** library provides React hooks that you can use to connect React components to a reSolve backend. The following hooks are provided.

| Hook                                                    | Description                                                              |
| ------------------------------------------------------- | ------------------------------------------------------------------------ |
| [useCommand](api-reference.md#usecommand)               | Initializes a command that can be passed to the backend                  |
| [useCommandBuilder](api-reference.md#usecommandbuilder) | Allows to generate commands based on input parameters                    |
| [useViewModel](api-reference.md#useviewmodel)           | Establishes a WebSocket connection to a reSolve View Model               |
| [useQuery](api-reference.md#usequery)                   | Allows a component to send queries to a reSolve Read Model or View Model |
| [useOriginResolver](api-reference.md#useoriginresolver) | Resolves a relative path to an absolute URL within the application.      |

#### Example

The [shopping-list-with-hooks](https://github.com/reimagined/resolve/tree/master/examples/shopping-list-with-hooks) example application demonstrates how to use the **resolve-react-hooks** library to communicate with a reSolve backend.
