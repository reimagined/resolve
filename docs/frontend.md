---
id: frontend
title: Frontend
description: This document describes approaches that you can use to implement a frontend for a reSolve application.
---

This document describes approaches that you can use to implement a frontend for a reSolve application. The following approaches are available:

- [HTTP API](#http-api) - An HTTP API exposed by a reSolve server
- [@resolve-js/client library](#resolve-jsclient-library) - A higher-level JavaScript library used to communicate with a reSolve server
- [@resolve-js/redux library](#resolve-jsredux-library) - A library used to connect a React + Redux component to reSolve
- [@resolve-js/react-hooks library](#resolve-jsreact-hooks-library) - A hook-based library used to connect React components to reSolve

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

##### @resolve-js/client:

```js
import { getClient } from '@resolve-js/client'
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

##### @resolve-js/redux:

```js
import { AppContainer, createStore, getOrigin } from '@resolve-js/redux'

const entryPoint = ({
  clientImports,
  rootPath,
  staticPath,
  viewModels,
  subscriber,
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
    isClient: true,
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

##### @resolve-js/react-hooks:

```js
import { ResolveContext } from '@resolve-js/react-hooks'
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
      target: 'node',
    },
  ],
  [
    'client/ssr.js',
    {
      outputFile: 'common/cloud-entry/ssr.js',
      moduleType: 'commonjs',
      target: 'node',
    },
  ],
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
      module: {
        package: '@resolve-js/runtime-base',
        import: 'liveRequireHandler',
      },
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

| Purpose            | Endpoint                                                    | Method |
| ------------------ | ----------------------------------------------------------- | ------ |
| Send a command     | `http://{host}:{port}/api/commands`                         | POST   |
| Query a Read Model | `http://{host}:{port}/api/query/{readModel}/{resolver}`     | POST   |
| Query a View Model | `http://{host}:{port}/api/query/{viewModel}/{aggregateIds}` | GET    |

#### Example

The code sample below demonstrates how you can implement JavaScript functions used to communicate with a reSolve server through its HTTP API:

```js
const apiCommandsUrl = '/api/commands'
const apiQueryUrl = '/api/query'

const sendCommand = async ({
  aggregateName,
  aggregateId,
  type,
  payload,
  jwt,
}) => {
  await fetch(apiCommandsUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${jwt}`,
    },
    body: JSON.stringify({
      aggregateName,
      aggregateId,
      type,
      payload,
    }),
  })
}

const queryReadModel = async (readModelName, resolver, parameters, jwt) => {
  const requestUrl = `${apiQueryUrl}/${readModelName}/${resolver}`
  const res = await fetch(requestUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${jwt}`,
    },
    body: JSON.stringify(parameters),
  })
  return await res.json()
}

const queryViewModel = async (viewModelName, aggregateIds, jwt) => {
  const requestUrl = `${apiQueryUrl}/${viewModelName}/${aggregateIds.join(',')}`
  const res = await fetch(requestUrl, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${jwt}`,
    },
  })
  return await res.json()
}
```

For more information on the HTTP API, refer to the following help topic: [API Reference](api/client/http-api.md).

You can extend a reSolve server's API with API Handlers. Refer to the following help topic for more information: [API Handlers](api-handlers.md).

## @resolve-js/client library

The **@resolve-js/client** library provides an interface that you can use to communicate with the reSolve backend from JavaScript code. To initialize the client, call the library's `getClient` function. This function takes a reSolve context as a parameter and returns an initialized client object. This object exposes the following functions:

| Function                                                            | Description                                                                 |
| ------------------------------------------------------------------- | --------------------------------------------------------------------------- |
| [command](api/client/resolve-client.md#command)                     | Sends an aggregate command to the backend.                                  |
| [query](api/client/resolve-client.md#query)                         | Queries a Read Model.                                                       |
| [getStaticAssetUrl](api/client/resolve-client.md#getstaticasseturl) | Gets a static file's full URL.                                              |
| [getOriginPath](api/client/resolve-client.md#getoriginpath)         | Returns an absolute URL within the application for the given relative path. |
| [subscribe](api/client/resolve-client.md#subscribe)                 | Subscribes to View Model updates.                                           |
| [unsubscribe](api/client/resolve-client.md#unsubscribe)             | Unsubscribes from View Model updates.                                       |

#### Example

The [with-vanilajs](https://github.com/reimagined/resolve/tree/master/templates/js/vanilla) template project demonstrates how to use the **@resolve-js/client** library to implement a frontend for a reSolve application in pure JavaScript.

## @resolve-js/redux library

The reSolve framework includes the client **@resolve-js/redux** library used to connect a client React + Redux app to a reSolve-powered backend.

Use the following @resolve-js/redux library's hooks and Higher-Order Components (HOCs) to connect react components to the backend.

##### React Hooks:

| Function Name                                                                      | Description                                                                 |
| ---------------------------------------------------------------------------------- | --------------------------------------------------------------------------- |
| [useReduxCommand](api/client/resolve-redux.md#usereduxcommand)                     | Creates a hook to execute a command.                                        |
| [useReduxReadModel](api/client/resolve-redux.md#usereduxreadmodel)                 | Creates a hook to query a Read Model.                                       |
| [useReduxReadModelSelector](api/client/resolve-redux.md#usereduxreadmodelselector) | Creates a hook to access a Read Model query result.                         |
| [useReduxViewModel](api/client/resolve-redux.md#usereduxviewmodel)                 | Creates a hook to receive a View Model's state updates and reactive events. |
| [useReduxViewModelSelector](api/client/resolve-redux.md#usereduxviewmodelselector) | Creates a hook to access a View Model's current state on the client.        |

##### Higher-Order Components:

| Function Name                                                                | Description                                                                                        |
| ---------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------- |
| [connectViewModel](api/client/resolve-redux.md#connectviewmodel)             | Connects a React component to a reSolve View Model.                                                |
| [connectReadModel](api/client/resolve-redux.md#connectreadmodel)             | Connects a React component to a reSolve Read Model.                                                |
| [connectRootBasedUrls](api/client/resolve-redux.md#connectrootbasedurls)     | Fixes URLs passed to the specified props so that they use the correct root folder path.            |
| [connectStaticBasedUrls](api/client/resolve-redux.md#connectstaticbasedurls) | Fixes URLs passed to the specified props so that they use the correct static resource folder path. |

#### Example

The [shopping-list-redux-hoc](https://github.com/reimagined/resolve/tree/master/examples/js/shopping-list-redux-hoc) example application demonstrates how to use the **@resolve-js/redux** library to implement a react-redux frontend for a reSolve application.

## @resolve-js/react-hooks library

The **@resolve-js/react-hooks** library provides React hooks that you can use to connect React components to a reSolve backend. The following hooks are provided.

| Hook                                                                     | Description                                                              |
| ------------------------------------------------------------------------ | ------------------------------------------------------------------------ |
| [useCommand](api/client/resolve-react-hooks.md#usecommand)               | Initializes a command that can be passed to the backend                  |
| [useCommandBuilder](api/client/resolve-react-hooks.md#usecommandbuilder) | Allows to generate commands based on input parameters                    |
| [useViewModel](api/client/resolve-react-hooks.md#useviewmodel)           | Establishes a WebSocket connection to a reSolve View Model               |
| [useQuery](api/client/resolve-react-hooks.md#usequery)                   | Allows a component to send queries to a reSolve Read Model or View Model |
| [useOriginResolver](api/client/resolve-react-hooks.md#useoriginresolver) | Resolves a relative path to an absolute URL within the application.      |

#### Example

The [shopping-list-with-hooks](https://github.com/reimagined/resolve/tree/master/examples/js/shopping-list) example application demonstrates how to use the **@resolve-js/react-hooks** library to communicate with a reSolve backend.
