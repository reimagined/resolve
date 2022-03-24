---
id: overview
title: Overview
---

# Modules Overview

In reSolve, a module encapsulates a fragment of functionality that can be included by an application. A module can include any structural parts of a reSolve application in any combination.

A module is a standalone configuration object that can reference client code, read-side and write-side code, sagas and HTTP handlers. To include a module into your application, you need to initialize this object with any required additional settings and merge it into your application's centralized config:

**run.js:**

```js
const moduleAuth = resolveModuleAuth([
  {
    name: 'local-strategy',
    createStrategy: 'auth/create_strategy.js',
    logoutRoute: {
      path: 'logout',
      method: 'POST',
    },
    routes: [
      {
        path: 'register',
        method: 'POST',
        callback: 'auth/route_register_callback.js',
      },
      {
        path: 'login',
        method: 'POST',
        callback: 'auth/route_login_callback.js',
      },
    ],
  },
])

const baseConfig = merge(
  defaultResolveConfig,
  appConfig,
  moduleComments,
  moduleAuth
)
```

A merged module's code is included in the resulting application's bundles.

For an example on how to use modules, see the [Hacker News](https://github.com/reimagined/resolve/tree/master/examples/js/hacker-news) sample application. This application uses the authentication and comments modules from reSolve.
