---
id: authentication
title: Authentication
---

# Authentication Module

The reSolve authentication module ([@resolve-js/module-auth](https://www.npmjs.com/package/@resolve-js/module-auth)) adds support for [Passport](https://www.passportjs.org/) compatible authentication strategies ([https://github.com/jaredhanson/passport-strategy](https://github.com/jaredhanson/passport-strategy)).

## Installation

Use the following console input to install the authentication module:

```sh
yarn add @resolve-js/module-auth
```

## Register and Configure the Module

Register the installed module in the project's `run.js` file. The code sample below demonstrates how to initialize the authentication module configured for the [`Local`](https://www.passportjs.org/packages/passport-local/) authentication strategy and merge it into the application's centralized configuration object:

```js title="run.js"
import { defaultResolveConfig, build, start, watch, runTestcafe, merge, injectRuntimeEnv } from '@resolve-js/scripts'
import createAuthModule from '@resolve-js/module-auth' // Import the authentication module.

import appConfig from './config.app' // Main application configuration file that defines the domain logic.
import devConfig from './config.dev' // The development environment configuration.
// Other configs are omitted for simplicity.

const launchMode = process.argv[2]

void (async () => {
  const authModule = createAuthModule([ // Initialize the authentication module with settings specified below.
    {
      name: 'local-strategy', // The name of a Passport authentication strategy to use.
      createStrategy: 'auth/create_strategy.js', // A path to the strategy constructor file within the project.
      options: { // An object that contains custom options passed to the strategy constructor.
        strategySecretKey: injectRuntimeEnv('STRATEGY_SECRET_KEY_ENV_VARIABLE_NAME')
      },
      logoutRoute: { // An HTTP route for user logout.
          path: 'logout',
          method: 'POST'
      }
      routes: [ // A list of HTTP API handlers required for the current strategy.
        {
          path: 'register', // The HTTP path segment after `http://app-domain.tld/rootPath/api/`.
          method: 'POST', // The HTTP method.
          callback: 'auth/route_register_callback.js' // The path to the API handler's definition.
        },
        {
          path: 'login',
          method: 'POST',
          callback: 'auth/route_login_callback.js'
        }
      ]
    }
  ])

  switch (launchMode) {
    case 'dev': {
      await watch( // Merge the configuration objects.
        merge([defaultResolveConfig, appConfig, devConfig, authModule])
      )
      break
    }

    // Handle the `prod`, `cloud`, and `test:functional` run modes based on your requirements.
  }
})().catch(error => {
  // eslint-disable-next-line no-console
  console.log(error)
})
```

The code sample below demonstrates an example implementation of a strategy constructor passed to `createAuthModule`:

```js title="auth/create_strategy.js"
import { Strategy as StrategyFactory } from 'passport-local' // Import the passport strategy.

const createStrategy = (options) => ({
  // Export a function that accepts runtime options specified in the application config.
  factory: StrategyFactory, // The passport strategy factory.
  options: {
    // Custom compile-time options ...
    failureRedirect: (error) =>
      `/error?text=${encodeURIComponent(error.message)}`,
    errorRedirect: (error) =>
      `/error?text=${encodeURIComponent(error.message)}`,
    usernameField: 'username',
    passwordField: 'password',
    successRedirect: null,
    // ... runtime options (for example, secret keys)
    ...options,
  },
})

export default createStrategy
```

## Add the Required API Handlers

In your application, you need to implement [API handlers](../api-handlers.md) for user registration, login, and other authentication-related actions. For example, the code sample below demonstrates a user registration handler.

```js title="auth/route_register_callback.js"
import jwt from 'jsonwebtoken'
import jwtSecret from './jwt_secret' // Store your JWT secret in a secure location (for example, an environment variable).
import bcrypt from 'bcrypt'

// A route handler accepts `req` as the first argument. The rest of the arguments depend on the used strategy.
// The `Local` strategy adds two arguments - `username` and `password`.
const routeRegisterCallback = async ({ resolve }, username, password) => {
  const { data: existingUser } = await resolve.executeQuery({
    // Query a read model to check if the user already exists.
    modelName: 'users',
    resolverName: 'find-user',
    resolverArgs: { name: username.trim() },
  })
  // If the user exists, throw an error.
  if (existingUser) {
    throw new Error('Cannot create user')
  }
  // Define a `user` structure to pass to the aggregate as a command payload and save to the JWT.
  const user = {
    name: username.trim(),
    password: bcrypt.hashSync(password),
    id: uuid.v4(),
  }
  // Try to create a user in the domain.
  await resolve.executeCommand({
    type: 'create-user',
    aggregateId: user.id,
    aggregateName: 'user',
    payload: user,
  })
  // An authentication API handler should always return a signed JWT that encodes the user structure.
  // The JWT can include additional data such as user roles.
  // To drop the JWT, sign an empty object. Non-object arguments are not allowed.
  return jwt.sign(user, jwtSecret)
}

export default routeRegisterCallback
```

## Example

The [Hacker News](https://github.com/reimagined/resolve/tree/dev/examples/js/hacker-news) example project uses [@resolve-js/module-auth](https://www.npmjs.com/package/@resolve-js/module-auth) to implement user authentication.
