---
id: resolve-context
title: ReSolve Context
description: The resolve context object is available to an API handler function through its request (req) argument. This object implements a communication layer between an API handler and the reSolve framework.
---

The `resolve` context object is available to an [API handler](api-handler.md) function through its [request (`req`)](api-handler.md#request) argument. This object implements a communication layer between an API handler and the reSolve framework.

The `resolve` context object exposes the following API:

## Objects

| Field Name          | Description                                                       |
| ------------------- | ----------------------------------------------------------------- |
| `uploader`          | Exposes the file upload API.                                      |
| `eventstoreAdapter` | Exposes the [event store adapter API](../event-store-adapter.md). |
| `performanceTracer` | Exposes the performance tracer API.                               |
| `monitoring`        | Exposes the monitoring API.                                       |

## Methods

| Function Name                       | Description                         |
| ----------------------------------- | ----------------------------------- |
| [`executeCommand`](#executecommand) | Emits a command on the server side. |
| [`executeQuery`](#executequery)     | Queries a read model or view model. |

### `executeCommand`

Emits a command on the server side.

#### Example

```js
const myApiHandler = async (req, res) => {
  const { resolve } = req
  try {
    const result = await resolve.executeCommand({
      type: 'addItem',
      aggregateName: 'MyItems',
      aggregateId: uuid(),
      payload: { name: itemName },
    })
    ...
  } catch (e) {
    ...
  }
}
```

#### Arguments

| Argument Name | Type                                              | Description                  |
| ------------- | ------------------------------------------------- | ---------------------------- |
| `command`     | A [command](../command.md#command-object) object. | Describes a command to emit. |

#### Result

A `promise` that resolves to a [command result](../command.md#command-result-object) object.

### `executeQuery`

#### Example

```js
const myApiHandler = async (req, res) => {
  const { resolve } = req
  try {
    const result = await resolve.executeQuery({
      modelName: 'MyList',
      resolverName: 'all',
    })
    ...
  } catch (e) {
    ...
  }
}
```

#### Arguments

| Argument Name | Type                                                                                                                         | Description                   |
| ------------- | ---------------------------------------------------------------------------------------------------------------------------- | ----------------------------- |
| `query `      | A [read model query](../read-model/query.md#query-object) or [view model query](../view-model/query.md#query-object) object. | Describes a query to execute. |

#### Result

A `promise` that resolves to a [read model query result](../read-model/query.md#result-object) or [view model query result](../view-model/query.md#result-object) depending on the query object's type.

## Constants

| Constant Name     | Type     | Description                                                                                                                                                                     |
| ----------------- | -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `applicationName` | `string` | The reSolve application's name as specified in `package.json`.                                                                                                                  |
| `distDir`         | `string` | The path to the WebPack `dist` directory within the application.                                                                                                                |
| `jwtCookie`       | `object` | An object that contain [JWT cookie settings](../../application-configuration.md#jwtcookie) as specified in the [application configuration](../../application-configuration.md). |
| `rootPath`        | `string` | The application's root URL path.                                                                                                                                                |
| `staticDir`       | `string` | The path to a directory that contains static files.                                                                                                                             |
| `staticPath`      | `string` | The base URL path for static file URLs.                                                                                                                                         |
