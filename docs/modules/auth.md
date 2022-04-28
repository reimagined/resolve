---
id: authentication
title: Authentication
---

# Authentication Module

The reSolve authentication module ([@resolve-js/module-auth](https://www.npmjs.com/package/@resolve-js/module-auth)) adds support for [Passport](https://www.passportjs.org/) compatible authentication strategies ([https://github.com/jaredhanson/passport-strategy](https://github.com/jaredhanson/passport-strategy)).

## Installation

Use the following console input to install the uploader module:

```sh
yarn add @resolve-js/module-uploader
```

## Register and Configure the Module

Register the installed module in the project's `run.js` file. The code sample below demonstrate how to create a module configured for the local authentication strategy and merge it into the application's centralized config:

```js title="run.js"
import { defaultResolveConfig, build, start, watch, runTestcafe, merge, injectRuntimeEnv } from '@resolve-js/scripts'
import createAuthModule from '@resolve-js/module-auth' // Import authentication module

import appConfig from './config.app' // Main application config with defined domain logic
import devConfig from './config.dev' // Development config. Prod and other configs ommited here for simplicity
const launchMode = process.argv[2]

void (async () => {
  const authModule = createAuthModule([ // Create authentication module to merge in config
    {
      name: 'local-strategy', // Strategy name
      createStrategy: 'auth/create_strategy.js', // Path to strategy construction file in the project dirrectory.
      options: { // Passed vary compile-time/runtime options
        strategySecretKey: injectRuntimeEnv('STRATEGY_SECRET_KEY_ENV_VARIABLE_NAME')
      },
      logoutRoute: { // HTTP route for logout
          path: 'logout',
          method: 'POST'
      }
      routes: [ // HTTP API handlers the for current strategy
        {
          path: 'register', // HTTP path part after http://app-domain.tld/rootPath/api/
          method: 'POST', // HTTP invocation method
          callback: 'auth/route_register_callback.js' // Path to API handler. See implementation details below.
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
      await watch( // Merge developer-defined and module-generated configs using the merge tool
        merge([defaultResolveConfig, appConfig, devConfig, authModule])
      )
      break
    }

    // Handle prod, cloud, test:functional modes in some manner
  }
})().catch(error => {
  // eslint-disable-next-line no-console
  console.log(error)
})
```

The code sample below demonstrates an example implementation of a strategy constructor passed to `createAuthModule`:

```js title="auth/create_strategy.js"
import { Strategy as StrategyFactory } from 'passport-local' // Import passport strategy

const createStrategy = (options) => ({
  // Export function that will accept runtime vary options from application config
  factory: StrategyFactory, // Re-export passport strategy factory
  options: {
    // Custom compile-time options ...
    failureRedirect: (error) =>
      `/error?text=${encodeURIComponent(error.message)}`,
    errorRedirect: (error) =>
      `/error?text=${encodeURIComponent(error.message)}`,
    usernameField: 'username',
    passwordField: 'username',
    successRedirect: null,
    // ... plus runtime options, like secret keys
    ...options,
  },
})

export default createStrategy
```

## Add the Required API Handlers

In your application, you need to manually implement [API handlers](../api-handlers.md) for user registration, login, and other authentication-related actions. For example, the code sample below demonstrates a user registration handler.

```js title="auth/route_register_callback.js"
import jwt from 'jsonwebtoken'
import jwtSecret from './jwt_secret' // Store JWT secret in a secret location, for example an environment variable
import bcrypt from 'bcrypt'

// Route handler accepts req as first argument, and second and following arguments is strategy result
// Local strategy returns two arguments - username and password. It's strictly strategy-dependent
const routeRegisterCallback = async ({ resolve }, username, password) => {
  const { data: existingUser } = await resolve.executeQuery({ // Query a read model to check if user exists
    modelName: 'read-model-name',
    resolverName: 'resolver-name',
    resolverArgs: { name: username.trim())  }
  })
  // Throw if user already exists
  if (existingUser) {
    throw new Error('Cannot create user')
  }
  // Define a user structure to pass in aggregate and jwt token
  const user = {
    name: username.trim(),
    password: bcrypt.hashSync(password),
    id: uuid.v4()
  }
  // Try to create user in domain
  await resolve.executeCommand({
    type: 'create-user',
    aggregateId: user.id,
    aggregateName: 'user',
    payload: user
  })
  // Return signed JWT with user struct, potentially includes user role and so on.
  // It's most important step - authentication API handler always should return signed JWT value.
  // To drop JWT - just sign empty object. Non-object argument is not allowed.
  return jwt.sign(user, jwtSecret)
}

export default routeRegisterCallback
```
