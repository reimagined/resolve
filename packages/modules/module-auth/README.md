# **@resolve-js/module-auth**

The reSolve authentication module provides out-of-the-box support for Passport compatible authentication strategies (https://github.com/jaredhanson/passport-strategy).
When you use `@resolve-js/module-auth` in a resolve application, you only need to specify an authentication strategy and API routes for login, registration and other actions.

Use `@resolve-js/module-auth` in application in the following manner.

Entry point (run.js):

```js
import { defaultResolveConfig, build, start, watch, runTestcafe, merge, injectRuntimeEnv } from '@resolve-js/scripts'
import createAuthModule from '@resolve-js/module-auth' // Import authentication module

import appConfig from './config.app' // Main application config with defined domain logic
import devConfig from './config.dev' // Development config. Prod and other configs ommited here for simplicity
const launchMode = process.argv[2]

void (async () => {
  const authModule = createAuthModule([ // Create authentication module to merge in config
    {
      name: 'local-strategy', // Strategy name
      createStrategy: 'auth/create_strategy.js', // Path to strategy construction file in project
      options: { // Passed vary compile-time/runtime options
        strategySecretKey: injectRuntimeEnv('STRATEGY_SECRET_KEY_ENV_VARIABLE_NAME')
      },
      logoutRoute: { // HTTP route for logout
          path: 'logout',
          method: 'POST'
      }
      routes: [ // HTTP API handlers for current strategy
        {
          path: 'register', // HTTP path part after http://app-domain.tld/rootPath/api/
          method: 'POST', // HTTP invocation method
          callback: 'auth/route_register_callback.js' // Path to API handler
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

Strategy constructor (auth/create_strategy.js):

```js
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

The "Register" API handler (`auth/route_register_callback.js`), other handlers are omitted:

```js
import jwt from 'jsonwebtoken'
import jwtSecret from './jwt_secret' // Store JWT secret in secret place, like environment variable
import bcrypt from 'bcrypt'

// Route handler accepts req as first argument, and second and following arguments is strategy result
// Local strategy returns two arguments - username and password. It's strictly strategy-dependent
const routeRegisterCallback = async ({ resolve }, username, password) => {
  const { data: existingUser } = await resolve.executeQuery({ // Request read model to check user is exists
    modelName: 'read-model-name',
    resolverName: 'resolver-name',
    resolverArgs: { name: username.trim())  }
  })
  // Throw if user is already exists
  if (existingUser) {
    throw new Error('User can not be created')
  }
  // Describe user struct to pass in aggregate and jwt token
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

[![npm version](https://badge.fury.io/js/%40resolve-js%2Fmodule-auth.svg)](https://badge.fury.io/js/%40resolve-js%2Fmodule-auth)

![Analytics](https://ga-beacon.appspot.com/UA-118635726-1/packages-@resolve-js/module-auth-readme?pixel)
