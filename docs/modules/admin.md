---
id: admin
title: Admin
---

# Admin Module

The reSolve admin module ([@resolve-js/module-admin](https://www.npmjs.com/package/@resolve-js/module-admin)) adds [API handlers](../api-handlers.md) that allow you to manage an application's read models and sagas. The module package also contains a CLI tool that allows you to query these handlers through a console interface.

:::caution

The admin module is intended for use in development and test environments only.

:::

The admin module includes the following functionality:

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

Register the installed module in the project's `run.js` file. The code sample below demonstrates how to enable the admin module for the development and testing run modes:

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

### Usage

To use the admin module's CLI tool, you need to start your application and execute the `module-admin` script with the required command:

```bash
yarn module-admin read-models reset ShoppingList
```

The default URL that the CLI tool uses to access an application's API is `http://localhost:3000/api`. Use the `--api-url` option to specify another URL:

```bash
yarn module-admin --api-url "https://127.0.0.1:2000/api" read-models reset ShoppingList
```

You can use the built-in `help` command to view information on the available CLI commands:

```bash
yarn module-admin --help
```

### Manage Application

The `system` command manages the application's running status.

#### Show the system's status

```
npx @resolve-js/module-admin system status
```

#### Wait until the application startup is finished

```
npx @resolve-js/module-admin system status --wait-ready
```

### Manage Event Store

The `event-store` command manages the application's event store.

#### Import an event store from the specified directory

```
npx @resolve-js/module-admin event-store import <directory>
```

#### Export an event store to the specified directory

```
npx @resolve-js/module-admin event-store import <directory>
```

#### Incrementally import an event store from the file

```
npx @resolve-js/module-admin event-store incremental-import <file>
```

#### Freeze an event store

```
npx @resolve-js/module-admin event-store freeze
```

#### Unfreeze an event store

```
npx @resolve-js/module-admin event-store unfreeze
```

### Manage Read Models

The `read-models` command manages the application's read models.

##### View a deployed application's read models:

```
npx @resolve-js/module-admin read-models list
```

##### Pause and resume read model updates:

```
npx @resolve-js/module-admin read-models pause <readModelName>
```

```
npx @resolve-js/module-admin read-models resume <readModelName>
```

##### Reset a read model's persistent state:

```
npx @resolve-js/module-admin read-models reset <readModelName>
```

### Manage Sagas

The `sagas` command manages the application's sagas.

##### View a list of available sagas:

```
npx @resolve-js/module-admin sagas list
```

##### Pause and resume a saga:

```
npx @resolve-js/module-admin sagas pause <sagaName>
```

```
npx @resolve-js/module-admin sagas resume <sagaName>
```

##### Reset a saga's persistent state:

```
npx @resolve-js/module-admin sagas reset <sagaName> [--side-effects-start-timestamp YYYY-MM-DDTHH:mm:ss.sssZ]
```

### Manage Saga Properties

Use the `sagas properties` command to manage a saga's properties.

##### Set a property:

```
npx @resolve-js/module-admin sagas properties set <sagaName> <propertyName> <value>
```

##### Get a property:

```
npx @resolve-js/module-admin sagas properties get <sagaName> <propertyName>
```

##### View all saga properties:

```
npx @resolve-js/module-admin sagas properties list <sagaName>
```

##### Remove a property:

```
npx @resolve-js/module-admin sagas properties remove <sagaName> <propertyName>
```
