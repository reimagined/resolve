# Server HTTP API

This document describes the HTTP API used in reSolve to communicate between the **Server** and the **Client**. You can use it when the reSolve client side does not suit your needs, for instance, in unit tests for your reSolve backend.

## Send a Command

### Request Destination

* **Method**: POST
* **URL**: `http://{host}:{port}/api/commands`

#### URL Parameters

| Name      | Description
| --------- | -----------------------
| host      | The backend host URL (e.g. `localhost`)
| port      | The backend port (default is `3000`)

### Headers

```
Content-Type: application/json
```

### Request Body

```javascript
{
  "aggregateName": aggregateName,
  "type": commandType,
  "aggregateId": aggregateID,
  "payload": {
    param1: value1,
    param2: value2,
    // ...
    paramN: valueN
  }
}
```

#### Parameters

|        Name   |  Type  | Description
| ------------- | ------ | ------------
| aggregateId   | string | The ID of an aggregate to which you are addressing the command
| aggregateName | string | The aggregate's name as defined in [config.app.js](../examples/shopping-list/config.app.js)
| commandType   | string | The command type supported by [the aggregate](../examples/shopping-list/common/aggregates)
| payload       | object | The parameters that [the command](../examples/shopping-list/common/aggregates) accepts

### Example

Use the following command to add an item to the [shopping-list example](../examples/shopping-list).

```sh
curl -X POST -H "Content-Type: application/json" \
-d "{\"aggregateName\":\"Todo\", \"type\":\"createItem\", \"aggregateId\":\"root-id\", \"payload\": {\"id\":`date +%s`, \"text\":\"Learn reSolve API\"}}" \
"http://localhost:3000/api/commands"
```

## Fetch a [View Model](./View%20Model.md)

### Request Destination

* **Method**: GET
* **URL**: `http://{host}:{port}/api/query/{viewModel}/{aggregateIds}`

#### URL Parameters

| Name      | Description
| --------- | -----------------------
| host      | The backend host URL (e.g. `localhost`)
| port      | The backend port (default is `3000`)
| viewModel | The View Model name as defined in [config.app.js](../examples/shopping-list/config.app.js)
| aggregateIds | The comma-separated list of Aggregate IDs to include into the View Model. Use `*` to include all Aggregates

### Response

```javascript
serializedState
```

#### Variables

|        Name          |  Type  | Description
| -------------------- | ------ | ------------
| serializedState      | string | The serialized View Model object (the default serialization method is JSON dumping)

### Example Request

Use the following command to get the current [shopping-list example](../examples/shopping-list) state.


```sh
curl -g -X GET "http://localhost:3000/api/query/Default/shoppingLists"
```

### Example Response

```javascript
{"serializedState":"{\"1532620308\":{\"text\":\"Hello World\",\"checked\":true},\"1532620333\":{\"text\":\"Learn reSolve API\",\"checked\":false}}","aggregateVersionsMap":{"root-id":2}}
```

## [Query](./Query.md) a [Read Model](./Read%20Model.md) 

### Request Destination

* **Method**: POST
* **URL**: `http://{host}:{port}/api/query/{readModel}/{resolver}`

#### URL Parameters

| Name      | Description
| --------- | -----------------------
| host      | The backend host URL (e.g., `localhost`)
| port      | The backend port (default is `3000`)
| readModel | The Read Model name as defined in [config.app.js](../examples/with-saga/config.app.js)
| resolver  | The name of a [resolver defined in the Read Model](../examples/with-saga/common/read-models/default.resolvers.js)

### Headers

```
Content-Type: application/json
```

### Request Body

```javascript
{
  param1: value1,
  param2: value2,
  // ...
  paramN: valueN
}
```

The object contains the parameters that [the resolver](../examples/with-saga/common/read-models/default.resolvers.js) accepts

### Response

```javascript
serializedResult
```

#### Variables

|        Name          |  Type  | Description
| -------------------- | ------ | ------------
| serializedResult     | string | The serialized Read Model resolve result 

The [result](../examples/with-saga/common/read-models/default.resolvers.js) is not limited to any type or structure.

### Example

Use the following command to get 3 users from the [with-saga](../examples/with-saga) example.

```sh
curl -X POST \
-H "Content-Type: application/json" \
-d "{\"page\":0, \"limit\":3}" \
"http://localhost:3000/api/query/default/users"
```

### Example Response

```javascript
{
  "result": [
    { "id": "jwt=yeJ...", "email": "example@example.com", "timestamp": 1534160787935 },
    { "id": "jwt=yeJ...", "email": "email@email.com", "timestamp": 1534160788935 },
    { "id": "jwt=yeJ...", "email": "user@email.com", "timestamp": 1534160789935 }
  ]
}

```
