---
id: middleware
title: Middleware
description: This document describes API used by Aggregate and Read Model middleware
---

## Command Middleware

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

The handler function takes the following parameters:

| Parameter Name    | Description                                                     |
| ----------------- | --------------------------------------------------------------- |
| middlewareContext | Contains data that describes the currently processed operation. |
| state             | The aggregate's state.                                          |
| command           | An object that contains data about the incoming command.        |
| context           | The command [context](command-handler.md#context) object.       |

### middlewareContext

A command middleware handler's `middlewareContext` argument is an object with the following fields:

| Field Name | Description                                                     |
| ---------- | --------------------------------------------------------------- |
| req        | Stores data that describes the currently processed HTTP request |
| res        | Contains function used to configure the server's response       |

## Read Model Projection Middleware

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

The handler function takes the following parameters:

| Parameter Name    | Description                                                                   |
| ----------------- | ----------------------------------------------------------------------------- |
| middlewareContext | Contains data that describes the currently processed operation.               |
| store             | The read model store.                                                         |
| event             | The incoming event object.                                                    |
| context           | The read model projection [context](read-model-projection.md#context) object. |

### middlewareContext

A projection middleware handler's `middlewareContext` argument is an object with the following fields:

| Field Name    | Description                                                     |
| ------------- | --------------------------------------------------------------- |
| req           | Stores data that describes the currently processed HTTP request |
| res           | Contains function used to configure the server's response       |
| readModelName | The name of the processed read model.                           |

## Read Model Resolver Middleware

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

The handler function takes the following parameters:

| Parameter Name    | Description                                                               |
| ----------------- | ------------------------------------------------------------------------- |
| middlewareContext | Contains data that describes the currently processed operation.           |
| store             | The read model store.                                                     |
| params            | The request parameters passed to the resolver.                            |
| context           | The read model resolver [context](read-model-resolver.md#context) object. |

### middlewareContext

A projection middleware handler's `middlewareContext` argument is an object with the following fields:

| Field Name    | Description                                                     |
| ------------- | --------------------------------------------------------------- |
| req           | Stores data that describes the currently processed HTTP request |
| res           | Contains function used to configure the server's response       |
| readModelName | The name of the processed read model.                           |
| resolverName  | The name of the queried resolver.                               |
