---
id: middleware
title: Middleware
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

In a middleware handler, you can modify one or several of the handler's parameters and pass their changed versions to the `next` function so they propagate down the processing chain. For example, you can modify the `command` object, add auxiliary data to the `context` object and so on. You can also intercept and modify data returned back through the chain.

:::caution

Keep in mind that poorly implemented middleware can brake an application because middleware intercepts the internal request and event processing chains and can potentially disrupt them.

:::

For details on the API used to implement different types of middleware, refer to the following sections of the [middleware API reference](api/middleware.md):

- [Command Middleware](api/middleware.md#command-middleware)
- [Read Model Projection Middleware](api/middleware.md#read-model-projection-middleware)
- [Read Model Resolver Middleware](api/middleware.md#read-model-resolver-middleware)

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

### Example

The [Personal Data](https://github.com/reimagined/resolve/tree/dev/examples/ts/personal-data) example application uses middleware to implement user authorization.
