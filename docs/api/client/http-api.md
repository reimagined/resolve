---
id: http-api
title: HTTP API
description: ReSolve provides a standard HTTP API that allows you to send aggregate commands, and query Read and View Models.
---

ReSolve provides a standard HTTP API that allows you to send aggregate commands, and query Read and View Models.

## Read Model API

To query a Read Model from the client side, send a POST request to the following URL:

```
http://{host}:{port}/api/query/{readModel}/{resolver}
```

##### URL Parameters:

| Name          | Description                                                             |
| ------------- | ----------------------------------------------------------------------- |
| **readModel** | The Read Model name as defined in the application's configuration file. |
| **resolver**  | The name of a [resolver defined in the Read Model](#resolvers)          |

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

## View Model API

To query a View Model from the client side, send a GET request to the following URL:

```
http://{host}:{port}/api/query/{viewModel}/{aggregateIds}
```

##### URL Parameters

| Name         | Description                                                                                               |
| ------------ | --------------------------------------------------------------------------------------------------------- |
| viewModel    | The View Model name as defined in the application's configuration file                                    |
| aggregateIds | The comma-separated list of Aggregate IDs to include in the View Model. Use `*` to include all Aggregates |

##### Example

Use the following command to get the [shopping-list](https://github.com/reimagined/resolve/tree/master/examples/js/shopping-list) example application's state:

```sh
curl -g -X GET "http://localhost:3000/api/query/Default/shoppingLists"
```

## Command API

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

## Authorization

To authorize your request on a reSolve server, specify a Bearer Token in your request's Authorization header:

```js
await fetch(Url, {
  ...
  headers: {
    Authorization: `Bearer ${jwt}`,
    ...
  },
  ...
})
```

See the [Authentication and Authorization](../../authentication-and-authorization.md) topic for information on how authorization is handled on server.

## Example

The code sample bellow demonstrates how to implement a JavaScript function that sends the specified command to a reSolve server with authorization.

```js
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
```
