# **@resolve-js/module-admin**

[![npm version](https://badge.fury.io/js/%40resolve-js%2Fmodule-admin.svg)](https://badge.fury.io/js/%40resolve-js%2Fmodule-admin)
![Analytics](https://ga-beacon.appspot.com/UA-118635726-1/packages-@resolve-js/module-admin-readme?pixel)

Use this module to manage a reSolve application's sagas and read models.

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

## Manage Application

The `system` command manages the application's system.

#### Show the system's status

```
npx @resolve-js/module-admin system status
```

#### Wait for an application to finish launching

```
npx @resolve-js/module-admin system status --wait-ready
```

## Manage Event Store

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

## Manage Read Models

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

## Manage Sagas

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

##### View all saga's properties:

```
npx @resolve-js/module-admin sagas properties list <sagaName>
```

##### Remove a property:

```
npx @resolve-js/module-admin sagas properties remove <sagaName> <propertyName>
```

## FAQ

### How to restart saga side effects starting from custom time

```
npx @resolve-js/module-admin sagas reset <sagaName> --side-effects-start-timestamp YYYY-MM-DDTHH:mm:ss.sssZ
npx @resolve-js/module-admin sagas resume <sagaName>
```
