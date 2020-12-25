---
id: manage-application
title: Manage a ReSolve Application
---

Use the [resolve-module-admin](https://github.com/reimagined/resolve/tree/master/packages/modules/resolve-module-admin#readme) CLI tool to manage a reSolve application's sagas and read models. It includes the following functionality:

- List application read models and sagas.
- Pause and resume updates for read models and sagas.
- Reset read model and saga persistent state.
- Manage saga properties.

You can use **npx** to run this tool without installation or install it as an application's dependency. See the [Installation](#installation) section for more information.

## Installation

Use the steps below to add the **resolve-module-admin** tool to a reSolve application.

1. Install the [resolve-module-admin](https://github.com/reimagined/resolve/tree/master/packages/modules/resolve-module-admin#readme) NPM package:

   ```bash
   yarn add resolve-module-admin
   ```

2. Register a script that runs the **resolve-module-admin** tool in the application's **package.json** file:

   ```js
   "scripts": {
     ...
     "resolve-module-admin": "resolve-module-admin",
     ...
   }
   ```

## Usage

The **resolve-module-admin** tool communicates with API handlers exposed by a reSolve application. To use the tool, you need to start your application. Then, you can execute **resolve-module-admin** with the required command:

```bash
yarn resolve-module-admin read-models reset ShoppingList
```

The default URL that **resolve-module-admin** uses to access a reSolve application's API is `http://localhost:3000/api`. Use the `--api-url` option to specify other URL:

```bash
yarn resolve-module-admin --api-url "https://127.0.0.1:2000/api" read-models reset ShoppingList
```

For the full list of supported commands, refer to the [NPM package's description](https://github.com/reimagined/resolve/tree/master/packages/modules/resolve-module-admin#readme) or use the built-in help command:

```bash
yarn resolve-module-admin --help
```
