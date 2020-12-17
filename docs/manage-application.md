---
id: manage-aplication
title: Manage a ReSolve Application
---

Use the [resolve-module-admin](https://github.com/reimagined/resolve/tree/master/packages/modules/resolve-module-admin#readme) utility to manage a reSolve application's sagas and read models. It provides the following functionality:

- List application read models and sagas.
- Pause and resume read model and saga updates.
- Reset read model and saga persistent state.
- Manage saga properties.

You can use **npx** to run this utility without installation or install it s an application's dependency as the following section describes.

## Installation

Use the steps bellow to add the **resolve-module-admin** utility to a reSolve application.

1. Install the [resolve-module-admin](https://github.com/reimagined/resolve/tree/master/packages/modules/resolve-module-admin#readme) NPM package:

   ```bash
   yarn add resolve-module-admin
   ```

2. Register a script that runs the **resolve-module-admin** utility in the application's **package.json** file:

   ```js
   "scripts": {
     ...
     "resolve-module-admin": "resolve-module-admin",
     ...
   }
   ```

## Usage

The **resolve-module-admin** utility communicates with API handlers exposed by a reSolve application. To use the utility, run the application and execute one of the utility's commands:

```bash
npx resolve-module-admin read-models list
```

For the full list of supported commands, refer to the [NPM package's description](https://github.com/reimagined/resolve/tree/master/packages/modules/resolve-module-admin#readme) or use the `--help` option in the console.
