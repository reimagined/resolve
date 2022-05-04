---
id: manage-application
title: Manage an Application
description: Use the module-admin CLI tool to manage a reSolve application's sagas and read models.
---

Use the [module-admin](https://github.com/reimagined/resolve/tree/master/packages/modules/module-admin/README.md) CLI tool to manage a reSolve application's sagas and read models. It includes the following functionality:

- List application read models and sagas.
- Pause and resume updates for read models and sagas.
- Reset read model and saga persistent state.
- Manage saga properties.

## Installation

Use the steps below to add the **module-admin** tool to a reSolve application.

1. Install the [module-admin](https://github.com/reimagined/resolve/tree/master/packages/modules/module-admin/README.md) NPM package:

   ```bash
   yarn add @resolve-js/module-admin
   ```

2. Register a script that runs the **module-admin** tool in the application's **package.json** file:

   ```js
   "scripts": {
     ...
     "module-admin": "module-admin",
     ...
   }
   ```

3. Register **module-admin** as a module in the application's **run.js** file:

```js
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

## Usage

The **module-admin** tool adds API handlers to a reSolve application and sends queries to these handlers to manage the application. To use the tool, you need to start your application. Then, you can execute **module-admin** with the required command:

```bash
yarn module-admin read-models reset ShoppingList
```

The default URL that **module-admin** uses to access an application's API is `http://localhost:3000/api`. Use the `--api-url` option to specify another URL:

```bash
yarn module-admin --api-url "https://127.0.0.1:2000/api" read-models reset ShoppingList
```

For the full list of supported commands, refer to the [admin module](modules/admin.md) article or use the built-in help command:

```bash
yarn module-admin --help
```
