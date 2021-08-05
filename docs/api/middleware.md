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
| state             | The aggregates state.                                           |
| command           | An object that contains data about the incoming command.        |
| context           | Accumulates data throughout the processing chain.               |

## Read Model Projection Middleware

A read model projection middleware function has the following structure:

```js
const resolverMiddleware = (next) => (
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

| Parameter Name    | Description                                                     |
| ----------------- | --------------------------------------------------------------- |
| middlewareContext | Contains data that describes the currently processed operation. |
| store             | The read model store.                                           |
| event             | The incoming event object.                                      |
| context           | Accumulates data throughout the processing chain.               |

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

| Parameter Name    | Description                                                     |
| ----------------- | --------------------------------------------------------------- |
| middlewareContext | Contains data that describes the currently processed operation. |
| store             | The read model store.                                           |
| params            | The request parameters passed to the resolver.                  |
| context           | Accumulates data throughout the processing chain.               |
