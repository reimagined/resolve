---
id: middleware
title: Middleware
description: This document describes API used by Aggregate and Read Model middleware.
---

## Command Middleware

:::info TypeScript Support

A command middleware function has an associated TypeScript type:

- Type Name - `CommandMiddleware`
- Containing Package - `@resolve-js/core`

:::

A command middleware function has the following structure:

```js
const commandMiddleware = (next) => (
  middlewareContext,
  state,
  command,
  context
) => {
  ...
  state,
  return next(middlewareContext, state, command, context)
}
```

The middleware handler function receives the following arguments:

| Parameter Name    | Description                                                                                           |
| ----------------- | ----------------------------------------------------------------------------------------------------- |
| middlewareContext | Contains data that describes the currently processed operation.                                       |
| state             | The state object built by the aggregate [projection](../write-side.md#aggregate-projection-function). |
| command           | An object that contains data about the incoming command.                                              |
| context           | The command [context](aggregate/command-handler.md#context) object.                                   |

### middlewareContext

A command middleware handler's `middlewareContext` argument is an object with the following fields:

| Field Name | Description                                                      |
| ---------- | ---------------------------------------------------------------- |
| req        | Stores data that describes the currently processed HTTP request. |
| res        | Contains the function used to configure the server's response.   |

Both `req` and `res` fields are included only if the client sends the command. If the command is generated on the server (for example, by a saga or API handler), these fields are omitted.

## Read Model Projection Middleware

:::info TypeScript Support

A read model projection middleware function has an associated TypeScript type:

- Type Name - `ReadModelProjectionMiddleware`
- Containing Package - `@resolve-js/core`

:::

A read model projection middleware function has the following structure:

```js
const projectionMiddleware = (next) => (
  middlewareContext,
  store,
  event,
  context
) => {
  ...
  return next(middlewareContext, store, event, context)
}
```

The middleware handler function receives the following arguments:

| Parameter Name    | Description                                                                                           |
| ----------------- | ----------------------------------------------------------------------------------------------------- |
| middlewareContext | Contains data that describes the currently processed operation.                                       |
| store             | Exposes [API](read-model/store.md) used to communicate with the read model's persistent data storage. |
| event             | The incoming event object.                                                                            |
| context           | The read model projection [context](read-model/projection.md#context) object.                         |

### middlewareContext

A projection middleware handler's `middlewareContext` argument is an object with the following fields:

| Field Name    | Description                                                      |
| ------------- | ---------------------------------------------------------------- |
| req           | Stores data that describes the currently processed HTTP request. |
| res           | Contains the function used to configure the server's response.   |
| readModelName | The name of the processed read model.                            |

## Read Model Resolver Middleware

:::info TypeScript Support

A read model resolver middleware function has an associated TypeScript type:

- Type Name - `ReadModelResolverMiddleware`
- Containing Package - `@resolve-js/core`

:::

A read model resolver middleware function has the following structure:

```js
const resolverMiddleware = (next) => (
  middlewareContext,
  store,
  params,
  context
) => {
  ...
  return next(middlewareContext, store, params, context)
}
```

The middleware handler function receives the following arguments:

| Parameter Name    | Description                                                                                           |
| ----------------- | ----------------------------------------------------------------------------------------------------- |
| middlewareContext | Contains data that describes the currently processed operation.                                       |
| store             | Exposes [API](read-model/store.md) used to communicate with the read model's persistent data storage. |
| params            | An object that contains the request parameters as key-value pairs.                                    |
| context           | The read model resolver [context](read-model/resolver.md#context) object.                             |

### middlewareContext

A projection middleware handler's `middlewareContext` argument is an object with the following fields:

| Field Name    | Description                                                      |
| ------------- | ---------------------------------------------------------------- |
| req           | Stores data that describes the currently processed HTTP request. |
| res           | Contains the function used to configure the server's response.   |
| readModelName | The name of the processed read model.                            |
| resolverName  | The name of the queried resolver.                                |
