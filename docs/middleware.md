---
id: faq
title: FAQ
description: This describes how to use middleware in aggregates, read model resolvers and projections.
---

## General Information

The reSolve framework implements the middleware mechanism that you can use to add intermediate logic to the lifecycle of command handlers as well as read model resolvers and projections.

Middleware is defined as a curried function of the following format:

```js
// Takes *next* and returns a handler function
const myMiddleware = (next) =>
  // The handler function's signature depends on the middleware type
  (middlewareContext, state, command, context) => { // Command middleware handler
    ...
    // Regardless of the middleware type, a handler should either call **next** at the end
    // to continue the processing chain or throw an error
    return next(middlewareContext, state, command, context)
  }
  // (middlewareContext, store, event, context) => { ... } // Projection middleware handler
  // (middlewareContext, store, params, context) => { ... } // Resolver middleware handler
```

For details on how to implement different types of middleware, refer to the following sections of this document:

- [Command Middleware](#command-middleware)
- [Read Model Projection Middleware](#read-model-projection-middleware)
- [Read Model Resolver Middleware](#read-model-resolver-middleware)

The implemented middleware should be registered in the application's configuration file:

```js
// config.app.js
const appConfig = {
  ...
  middlewares: {
    aggregate: [
      'common/middlewares/command-middleware-1.js', // Middlewares are invoked in the order that they are deifined in the config
      'common/middlewares/command-middleware-2.js',
      'common/middlewares/command-middleware-3.js'
    ],
    readModel: {
        projection: ['common/middlewares/projection-middleware.js'],
        resolver: ['common/middlewares/resolver-middleware.js']
    }
  },
  ...
}
```

> **Note:** Take caution when you design middleware. Purely implemented middleware can easily brake an application because middleware intercepts the internal chain of request processing and can potentially disrupt it.

### Example

See to the [Personal Data](https://github.com/reimagined/resolve/tree/dev/examples/ts/personal-data) application for example middleware implementation.

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
