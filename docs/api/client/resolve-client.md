---
id: resolve-client
title: '@resolve-js/client'
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

### query

Queries a Read Model.

##### Example

```js
const { data } = await client.query({
  name: 'chat',
  aggregateIds: '*',
})
```

### getStaticAssetUrl

Gets a static file's full URL.

##### Example

```js
var imagePath = client.getStaticAssetUrl('/account/image.jpg')
```

### getOriginPath

Returns an absolute URL within the application for the given relative path.

##### Example

```js
var commandsApiPath = client.getOriginPath('/api/commands')
```

### subscribe

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

### unsubscribe

Unsubscribes from View Model updates.

##### Example

```js
await client.unsubscribe(subscription)
```
