---
id: faq
title: FAQ
description: This describes how to use middleware in command handlers, read model resolvers and projections.
---

## General Information

The reSolve framework implements the middleware mechanism that you can use to add intermediate logic to the lifecycle of command handlers as well as read model resolvers and projection.

To learn how to implement different types of middleware, refer to the following sections of this document:

- [Command Handler Middleware](#command-handler-middleware)
- [Read Model Resolver Middleware](#read-model-resolver-middleware)
- [Read Model Projection Middleware](#read-model-projection-middleware)

The implemented middleware should be registered in the application's configuration file:

```js
// config.app.js
const appConfig = {
  ...
  middlewares: {
    aggregate: ['common/middlewares/command-middleware.js'],
    readModel: {
        projection: ['common/middlewares/projection-middleware.js'],
        resolver: ['common/middlewares/resolver-middleware.js']
    }
  },
  ...
}
```

### Example

See to the [Personal Data](https://github.com/reimagined/resolve/tree/dev/examples/ts/personal-data) application for the example middleware implementation.

## Command Handler Middleware

```js
import { UnauthorizedError } from '../errors'
import { decode } from '../jwt'
const authMiddleware = (next) => (
  middlewareContext,
  state,
  command,
  context
) => {
  if (command.aggregateName === 'user-profile' && command.type === 'register') {
    return next(middlewareContext, state, command, context)
  }
  if (context.jwt) {
    const user = decode(context.jwt)
    return next(middlewareContext, state, command, { ...context, user })
  }
  throw new UnauthorizedError()
}
export default authMiddleware
```

## Read Model Resolver Middleware

```js
import { UnauthorizedError } from '../errors'
import { decode } from '../jwt'
const authMiddleware = (next) => (
  middlewareContext,
  store,
  params,
  context
) => {
  const { readModelName, resolverName } = middlewareContext
  if (
    readModelName === 'medias' ||
    (readModelName === 'user-profiles' &&
      ['profile', 'profileById', 'fullNameById'].includes(resolverName))
  ) {
    if (context.jwt) {
      const user = decode(context.jwt)
      return next(middlewareContext, store, params, { ...context, user })
    }
    throw new UnauthorizedError()
  }
  return next(middlewareContext, store, params, context)
}
export default authMiddleware
```

## Read Model Projection Middleware
