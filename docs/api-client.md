---
id: api-client
title: Client-Side API
---

## Client-Side API

### HTTP API

ReSolve provides a standard HTTP API that allows you to send aggregate commands, and query Read and View Models.

#### Read Model API

To query a Read Model from the client side, send a POST request to the following URL:

```
http://{host}:{port}/api/query/{readModel}/{resolver}
```

##### URL Parameters:

| Name          | Description                                                                                                                           |
| ------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| **readModel** | The Read Model name as defined in [config.app.js](https://github.com/reimagined/resolve/blob/master/examples/with-saga/config.app.js) |
| **resolver**  | The name of a [resolver defined in the Read Model](#resolvers)                                                                        |

The request body should have the `application/json` content type and the following structure:

```js
{
  param1: value1,
  param2: value2,
  // ...
  paramN: valueN
}
```

The object contains parameters that the resolver accepts.

##### Example

Use the following command to get 3 users from the [with-saga](https://github.com/reimagined/resolve/tree/master/examples/with-saga) example:

```sh
curl -X POST \
-H "Content-Type: application/json" \
-d "{\"page\":0, \"limit\":3}" \
"http://localhost:3000/api/query/default/users"
```

#### View Model API

To query a View Model from the client side, send a GET request to the following URL:

```
http://{host}:{port}/api/query/{viewModel}/{aggregateIds}
```

##### URL Parameters

| Name         | Description                                                                                                                               |
| ------------ | ----------------------------------------------------------------------------------------------------------------------------------------- |
| viewModel    | The View Model name as defined in [config.app.js](https://github.com/reimagined/resolve/blob/master/examples/shopping-list/config.app.js) |
| aggregateIds | The comma-separated list of Aggregate IDs to include in the View Model. Use `*` to include all Aggregates                                 |

##### Example

Use the following command to get the [shopping-list](https://github.com/reimagined/resolve/tree/master/examples/shopping-list) example application's state:

```sh
curl -g -X GET "http://localhost:3000/api/query/Default/shoppingLists"
```

#### Command API

You can send a command from the client side as a POST request to the following URL:

```
http://{host}:{port}/api/commands
```

The request body should have the `application/json` content type and contain the command's JSON representation.

```
{
  "aggregateName": aggregateName,
  "type": commandType,
  "aggregateId": aggregateID,
  "payload": {
    "param1": value1,
    "param2": value2,
    ...
    "paramN": valueN
  }
}
```

| Name              | Type   | Description                                           |
| ----------------- | ------ | ----------------------------------------------------- |
| **aggregateId**   | string | The ID of an aggregate that should handle the command |
| **aggregateName** | string | The aggregate's name as defined in **config.app.js**  |
| **commandType**   | string | The command type that the aggregate can handle        |
| **payload**       | object | Parameters the command accepts                        |

##### Example

Use the following command to add an item to the **shopping-list** example:

```sh
$ curl -X POST "http://localhost:3000/api/commands"
--header "Content-Type: application/json" \
--data '
{
  "aggregateName":"Todo",
  "type":"createItem",
  "aggregateId":"root-id",
  "payload": {
    "id":`date +%s`,
    "text":"Learn reSolve API"
  }
}
'
```

### Client Entry Point

The entry point is a function that is the first to be called when the client script runs. It takes a reSolve context object as a parameter.

##### client/index.js:

```js
const main = async resolveContext => {
...
}
export default main
```

The `resolveContext` object contains data used internally by reSolve client libraries to communicate with the backend.

See the [Client Application Entry Point](frontend.md#client-application-entry-point) section of the [Frontend](frontend.md) article for more information.

### @resolve-js/client Library

The **@resolve-js/client** library provides an interface that you can use to communicate with the reSolve backend from JavaScript code. To initialize the client, call the library's `getClient` function:

```js
import { getClient } from '@resolve-js/client'

const main = async resolveContext => {
  const client = getClient(resolveContext)
  ...
```

The `getClient` function takes a reSolve context as a parameter and returns an initialized client object. This object exposes the following functions:

| Function Name                           | Description                                                                 |
| --------------------------------------- | --------------------------------------------------------------------------- |
| [command](#command)                     | Sends an aggregate command to the backend.                                  |
| [query](#query)                         | Queries a Read Model.                                                       |
| [getStaticAssetUrl](#getstaticasseturl) | Gets a static file's full URL.                                              |
| [getOriginPath](#getoriginpath)         | Returns an absolute URL within the application for the given relative path. |
| [subscribe](#subscribe)                 | Subscribes to View Model updates.                                           |
| [unsubscribe](#unsubscribe)             | Unsubscribes from View Model updates.                                       |

#### command

Sends an aggregate command to the backend.

##### Example

```js
client.command(
  {
    aggregateName: 'Chat',
    type: 'postMessage',
    aggregateId: userName,
    payload: message,
  },
  (err) => {
    if (err) {
      console.warn(`Error while sending command: ${err}`)
    }
  }
)
```

#### query

Queries a Read Model.

##### Example

```js
const { data } = await client.query({
  name: 'chat',
  aggregateIds: '*',
})
```

#### getStaticAssetUrl

Gets a static file's full URL.

##### Example

```js
var imagePath = client.getStaticAssetUrl('/account/image.jpg')
```

#### getOriginPath

Returns an absolute URL within the application for the given relative path.

##### Example

```js
var commandsApiPath = client.getOriginPath('/api/commands')
```

#### subscribe

Subscribes to View Model updates. Returns a promise that resolves to a **subscription** object.

##### Example

```js
const chatViewModelUpdater = (event) => {
  const eventType = event != null && event.type != null ? event.type : null
  const eventHandler = chatViewModel.projection[eventType]

  if (typeof eventHandler === 'function') {
    chatViewModelState = eventHandler(chatViewModelState, event)
  }

  setImmediate(updateUI.bind(null, chatViewModelState))
}

await client.subscribe('chat', '*', chatViewModelUpdater)
```

#### unsubscribe

Unsubscribes from View Model updates.

##### Example

```js
await client.unsubscribe(subscription)
```

### @resolve-js/react-hooks library

The **@resolve-js/react-hooks** library provides React hooks that you can use to connect React components to a reSolve backend. The following hooks are provided.

| Hook                                    | Description                                                               |
| --------------------------------------- | ------------------------------------------------------------------------- |
| [useCommand](#usecommand)               | Initializes a command that can be passed to the backend.                  |
| [useCommandBuilder](#usecommandbuilder) | Allows a component to generate commands based on input parameters.        |
| [useViewModel](#useviewmodel)           | Establishes a WebSocket connection to a reSolve View Model.               |
| [useQuery](#usequery)                   | Allows a component to send queries to a reSolve Read Model or View Model. |
| [useOriginResolver](#useoriginresolver) | Resolves a relative path to an absolute URL within the application.       |

#### useCommand

Initializes a command that can be passed to the backend.

##### Example

```js
const ShoppingList = ({
  match: {
    params: { id: aggregateId }
  }
}) => {
  const renameShoppingList = useCommand({
    type: 'renameShoppingList',
    aggregateId,
    aggregateName: 'ShoppingList',
    payload: { name: shoppingList ? shoppingList.name : '' }
  })

  ...

  const onShoppingListNamePressEnter = event => {
    if (event.charCode === 13) {
      event.preventDefault()
      renameShoppingList()
    }
  }

  ...
}
```

#### useCommandBuilder

Allows a component to generate commands based on input parameters.

##### Example

```js
const ShoppingList = ({
  match: {
    params: { id: aggregateId }
  }
}) => {
  const clearItemText = () => setItemText('')

  const createShoppingItem = useCommandBuilder(
    text => ({
      type: 'createShoppingItem',
      aggregateId,
      aggregateName: 'ShoppingList',
      payload: {
        text,
        id: Date.now().toString()
      }
    }),
    clearItemText
  )

  ...

  const onItemTextPressEnter = event => {
  if (event.charCode === 13) {
    event.preventDefault()
    createShoppingItem(itemText)
  }

  ...
}
```

#### useViewModel

Establishes a WebSocket connection to a reSolve View Model.

##### Example

```js
const ShoppingList = ({
  match: {
    params: { id: aggregateId }
  }
}) => {
  const [shoppingList, setShoppingList] = useState({
    name: '',
    id: null,
    list: []
  })

  const { connect, dispose } = useViewModel(
    'shoppingList',
    [aggregateId],
    setShoppingList
  )

  useEffect(() => {
    connect()
    return () => {
      dispose()
    }
  }, [])

  ...

  const updateShoppingListName = event => {
    setShoppingList({ ...shoppingList, name: event.target.value })
  }

  ...
}
```

#### useQuery

Allows a component to send queries to a reSolve Read Model or View Model.

##### Example

```js
const MyLists = () => {
  const getLists = useQuery(
    { name: 'ShoppingLists', resolver: 'all', args: {} },
    (error, result) => {
      setLists(result)
    }
  )

  useEffect(() => {
    getLists()
  }, [])

  ...

  onCreateSuccess={(err, result) => {
    const nextLists = { ...lists }
    nextLists.data.push({
      name: result.payload.name,
      createdAt: result.timestamp,
      id: result.aggregateId
    })
    setLists(nextLists)
  }}

  ...
}
```

#### useOriginResolver

Resolves a relative path to an absolute URL within the application.

##### Example

```js
var resolver = useOriginResolver()
var commandApiPath = resolver('/api/commands')
```

### Request Middleware

The [@resolve-js/client](#resolve-client-library) and [@resolve-js/react-hooks](#resolve-react-hooks-library) libraries allow you to use request middleware to extend the client's functionality. Middleware implements intermediate logic that can modify the response object or handle errors before they are passed to the callback function.

Use a command's or query's `middleware` option to specify middleware:

#### @resolve-js/client:

```js
client.query(
  {
    name: "MyReadModel",
    resolver: "all"
  },
  {
    middleware: {
      response: [
        // An array of middleware that runs on server response
        createMyResponseMiddleware({
          // Middleware options
        }),
        ...
      ],
      error: [
        // An array of middleware that runs when there is a server error
        createMyErrorMiddleware({
          // Middleware options
        }),
        ...
      ]
    }
  },
  (error, result) => {
    ...
  }
})
```

#### @resolve-js/react-hooks:

```js
const myQuery = useQuery(
  {
    name: 'MyReadModel',
    resolver: 'all'
  },
  {
    middleware: {
      response: [
        // An array of middleware that runs on server response
        createMyResponseMiddleware({
          // Middleware options
        }),
        ...
      ]
      error: [
        // An array of middleware that runs on server error
        createMyErrorMiddleware({
          // Middleware options
        }),
        ...
      ]
    }
  },
  (error, result) => {
    ...
  }
```

Multiple middleware functions are run in the order they are specified in the options object.

#### Available Middlewares

This section lists request middleware included into the @resolve-js/client package. The following middleware is available:

| Name                                | Description                                               |
| ----------------------------------- | --------------------------------------------------------- |
| [parseResponse](#parseresponse)     | Deserializes the response data if it contains valid JSON. |
| [retryOnError](#retryonerror)       | Retries the request if the server responds with an error. |
| [waitForResponse](#waitforresponse) | Validates the response and retries if validation fails.   |

##### parseResponse

Deserializes the response data if it contains valid JSON. If the data is not JSON, the original string is kept. Initialized by the `createParseResponseMiddleware` factory function.

This middleware has no options. You can add it to a request as shown below:

```js
import { createParseResponseMiddleware } from '@resolve-js/client'
...

const { data } = await client.query(
  {
    name: 'articles',
    resolver: 'all'
  },
  {
    middleware: {
      response: [createParseResponseMiddleware()]
    }
  }
)
```

##### retryOnError

Retries the request if the server responds with an error. Initialized by the `createRetryOnErrorMiddleware` factory function.

The `retryOnError` middleware has the following options:

| Option Name | Description                                                          |
| ----------- | -------------------------------------------------------------------- |
| attempts    | The number of retries if the server responds with an error.          |
| errors      | An array of error codes that are allowed to trigger a retry.         |
| debug       | If set to `true`, the middleware logs errors in the browser console. |
| period      | The time between retries specified in milliseconds.                  |

You can add the `retryOnError` middleware to a request as shown below:

```js
import { createRetryOnErrorMiddleware } from '@resolve-js/client'
...

client.command(
  {
    aggregateName: 'Chat',
    type: 'postMessage',
    aggregateId: userName,
    payload: message
  },
  {
    middleware: {
      error: [
        createRetryOnErrorMiddleware({
          attempts: 3,
          errors: [500],
          debug: true,
          period: 500
        })
      ]
    }
  },
  err => {
    if (err) {
      console.warn(`Error while sending command: ${err}`)
    }
  }
)
```

##### waitForResponse

Validates the response and retries if validation fails. This allows you to check whether the response contains the latest data or wait for the Read Model to update.

Initialized by the `createWaitForResponseMiddleware` factory function.

The `waitForResponse` middleware has the following options:

| Option Name | Description                                                          |
| ----------- | -------------------------------------------------------------------- |
| attempts    | The number of retries if validation fails.                           |
| debug       | If set to `true`, the middleware logs errors in the browser console. |
| period      | The time between retries specified in milliseconds.                  |
| validator   | An async function that validates the response.                       |

You can add the `retryOnError` middleware to a request as shown below:

```js
import { createWaitForResponseMiddleware } from '@resolve-js/client'
...

const { data } = await client.query(
  {
    name: 'users',
    resolver: 'userById',
    args: {
      id: userId
    }
  },
  {
    middleware: {
      response: [
        createWaitForResponseMiddleware({
          attempts: 3,
          debug: true,
          period: 1,
          validator: async (response, confirm) => {
            if (response.ok) {
              const result = await response.json()
              if (result.data[userId]) {
                confirm(result)
              }
            }
          }
        })
      ]
    }
  }
)
```

#### Implement Custom Middleware

You can define custom middleware as follows:

```js
const myMiddleware = async (
  options, // Options passed to the factory function.
  response, // The second argument is either a response or error.
  params // Contains API you can use in your middleware implementation. See the API table below.
) => {
  // Put your middleware logic here
}

// Export the factory function.
export const createMyMiddleware = (options) =>
  waitForResponse.bind(null, options)
```

The `params` object exposes the following API:

| Field Name   | Description                                                                 |
| ------------ | --------------------------------------------------------------------------- |
| fetch        | A JavaScript fetch function you can use to perform arbitrary HTTP requests. |
| info         | An object that describes the current request.                               |
| init         | An object that is the fetch function's `init` parameter.                    |
| repeat       | A function you can call to repeat the current request.                      |
| end          | Call this function to commit the middleware execution result or error.      |
| state        | A state object passed between middleware functions.                         |
| deserializer | Returns a deserealized object from a string.                                |
| jwtProvider  | Used to get and set the JSON Web Token.                                     |
