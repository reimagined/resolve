---
id: resolve-client
title: '@resolve-js/client'
description: The @resolve-js/client library provides an interface that you can use to communicate with the reSolve backend from JavaScript code.
---

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

### command

Sends an aggregate command to the backend.

#### Arguments

| Argument Name | Description                                                       |
| ------------- | ----------------------------------------------------------------- |
| cmd           | An object that describes a command to send to the server.         |
| options       | An object that contains additional options for command execution. |
| callback      | A callback to call on the server response or error.               |

The returned value is a promise that resolves to the command result.

#### Example

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

### query

Queries a Read Model.

#### Arguments

| Argument Name | Description                                               |
| ------------- | --------------------------------------------------------- |
| qr            | A n object that describes a query.                        |
| options       | An object that contains additional options for the query. |
| callback      | A callback to call on the server response or error.       |

The returned value is a promise that resolves to the query result.

#### Example

```js
const { data } = await client.query({
  name: 'chat',
  aggregateIds: '*',
})
```

### getStaticAssetUrl

Gets a static file's full URL.

#### Arguments

| Argument Name | Description                                  |
| ------------- | -------------------------------------------- |
| assetPath     | A string that specifies a relative URL path. |

The returned value is a string that contains a full URL.

#### Example

```js
var imagePath = client.getStaticAssetUrl('/account/image.jpg')
```

### getOriginPath

Returns an absolute URL within the application for the given relative path.

#### Arguments

| Argument Name | Description                                  |
| ------------- | -------------------------------------------- |
| path          | A string that specifies a relative URL path. |

The returned value is a string that contains a full URL.

#### Example

```js
var commandsApiPath = client.getOriginPath('/api/commands')
```

### subscribe

Subscribes to View Model updates. Returns a promise that resolves to a **subscription** object.

#### Arguments

| Argument Name       | Description                                                                     |
| ------------------- | ------------------------------------------------------------------------------- |
| url                 | A URL used to establish a WebSocket connection to a view model.                 |
| cursor              | The data cursor used to traverse the events included into the query result set. |
| viewModelName       | A string that specifies the name of a view model.                               |
| aggregateIds        | A list of aggregate IDs for which to receive events.                            |
| handler             | A function that handles incoming events.                                        |
| subscribeCallback   | A callback called on successful subscription or error.                          |
| resubscribeCallback | A callback called on successful resubscription or error.                        |

The returned value is a promise that resolves to a subscription object.

#### Example

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

### unsubscribe

Unsubscribes from View Model updates.

#### Arguments

| Argument Name | Description            |
| ------------- | ---------------------- |
| subscription  | A subscription object. |

#### Example

```js
await client.unsubscribe(subscription)
```
