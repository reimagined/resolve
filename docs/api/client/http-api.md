---
id: http-api
title: HTTP API
---

ReSolve provides a standard HTTP API that allows you to send aggregate commands, and query Read and View Models.

## Read Model API

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

## View Model API

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
