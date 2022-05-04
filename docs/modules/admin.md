---
id: admin
title: Admin
---

# Admin Module

The reSolve admin module ([@resolve-js/module-admin](https://www.npmjs.com/package/@resolve-js/module-admin)) adds [API handlers](../api-handlers.md) that allow you to manage an application's read models and sagas. The module package also contains a CLI tool that allows you to query these handlers through a console interface without the need to write a custom application. The admin module includes the following functionality:

- List application read models and sagas.
- Pause and resume updates for read models and sagas.
- Reset read model and saga persistent state.
- Manage saga properties.

## Installation

Use the following console input to install the admin module:

```sh
yarn add @resolve-js/module-admin
```

## Register and Configure the Module

Register the installed module in the project's `run.js` file. The code sample below demonstrates how to enable the admin module for the development and testing environments:

```js title="run.js"
import resolveModuleAdmin from '@resolve-js/module-admin'
...
switch (launchMode) {
  case 'dev': {
    const moduleAdmin = resolveModuleAdmin()
    const resolveConfig = merge(
      defaultResolveConfig,
      appConfig,
      devConfig,
      moduleAdmin
    )
  }
  case 'test:e2e': {
    const moduleAdmin = resolveModuleAdmin()
    const resolveConfig = merge(
      defaultResolveConfig,
      appConfig,
      testFunctionalConfig,
      moduleAdmin
    )
  }
}
```

Register a script that runs the admin module's CLI tool in the application's **package.json** file:

```js title="package.json"
"scripts": {
  ...
  "module-admin": "module-admin",
  ...
}
```

## CLI Tool