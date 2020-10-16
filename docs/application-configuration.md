---
id: application-configuration
title: Application Configuration
---

## Overview

This document describes configuration options available for a reSolve application.

In a new reSolve application, configuration settings are split across the following files for different run targets:

- **config.app.js** - Contains general app configuration settings. In this file, you should register the application's aggregates, Read Models and View Models.
- **config.cloud.js** - Contains configuration settings that target the [reSolve Cloud](cloud-overview.md) environment.
- **config.dev.js** - Contains configuration settings that target the development server.
- **config.prod.js** - Contains configuration settings that target the production server.
- **config.test_functional.js** - Contains configuration settings that target the test environment.

All these options are merged into a global configuration object and passed to a run script based on the logic defined in the **run.js** file:

<!-- prettier-ignore-start -->

[mdis]:# (../tests/resolve-scripts-sample/run.js#watch)
```js
import {
  ...
  watch,
  ...
} from 'resolve-scripts'
    ...
    switch (launchMode) {
      ...
      case 'dev': {
        const resolveConfig = merge(baseConfig, devConfig)
        await watch(resolveConfig)
        break
      }
      ...
    }
```

<!-- prettier-ignore-end -->

Refer to the [JSON schema](https://github.com/reimagined/resolve/blob/master/packages/core/resolve-scripts/configs/schema.resolve.config.json) file to familiarize yourself with the definition of the configuration object's structure.

## Reference

### aggregates

An array of the application's aggregates. An aggregate configuration object within this array contains the following fields:

| Field            | Description                                                         |
| ---------------- | ------------------------------------------------------------------- |
| name             | The aggregate's name.                                               |
| commands         | A path to a file that defines aggregate commands.                   |
| projection       | A path to a file that defines aggregate projection.                 |
| serializeState   | A path to a file that defines a state serializer function.          |
| deserializeState | A path to a file that defines a state deserializer function.        |
| encryption       | A path to a file that defines data encryption and decryption logic. |

```js
aggregates: [
  {
    name: 'ShoppingList',
    commands: 'common/aggregates/shopping_list.commands.js',
    projection: 'common/aggregates/shopping_list.projection.js'
  }
]
```

### apiHandlers

Specifies an array of the application's API Handlers. An API handler configuration object within this array contains the following fields:

| Field   | Description                                                                                                                                         |
| ------- | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| path    | The URL path for which the handler is invoked. The path is specified in the [route-trie](https://www.npmjs.com/package/route-trie) router's format. |
| handler | The path to the file that contains the handler's definition.                                                                                        |
| method  | The HTTP method to handle.                                                                                                                          |

##### Example:

```js
apiHandlers: [
  {
    path: '/api/uploader/getFileUrl',
    handler: 'common/api-handlers/getFileUrl.js',
    method: 'GET'
  }
]
```

### clientEntries

Specifies an array of the client application script's entry points. The entry point is specified as a path to a JavaScript file. The file should export a function that takes a `resolveContext` as a parameter.

##### client/index.js:

```js
const main = async resolveContext => {
...
}
export default main
```

##### config.app.js:

```js
clientEntries: ['client/index.js']
```

In this section, you can also specify an array of Server Side Rendering (SSR) scripts that target different environments:

```js
clientEntries: [
  'client/index.js',
  [
    'client/ssr.js',
    {
      outputFile: 'common/local-entry/ssr.js',
      moduleType: 'commonjs',
      target: 'node'
    }
  ],
  [
    'client/ssr.js',
    {
      outputFile: 'common/cloud-entry/ssr.js',
      moduleType: 'commonjs',
      target: 'node'
    }
  ]
]
```

Each entry in this array should specify the path to the SSR script and a configuration object with the following fields:

| Field      | Description                                                                 |
| ---------- | --------------------------------------------------------------------------- |
| outputFile | The path to a file where to put the SSR script for the current environment. |
| moduleType | The type of a chunk generated by SSR.                                       |
| target     | The type of the environment that will run the script.                       |

The following module type options are available:

- `'iife'` - A chunk that contains an Immediately Invoked Function Expression (IIFE).
- `'commonjs'` - A chunk in the CommonJS module format.
- `'esm'` - A chunk in the ECMAScript module format.

The following target options are available:

- `'web'` - The client will run the script.
- `'node'` - The server will run the script.

To serve SSR markup to the client, you need to register the **live-require-handler.js** API handler in the **apiHandlers** configuration section:

##### config.app.js:

```js
...
apiHandlers: [
  {
    handler: {
      module: 'resolve-runtime/lib/common/handlers/live-require-handler.js',
      options: {
        modulePath: './ssr.js',
        moduleFactoryImport: false
      }
    },
    path: '/:markup*',
    method: 'GET'
  }
],
...
```

### clientImports

Specifies JavaScript files within the project, whose exports should be passed to the client script through the client entry point's parameter.

The configuration object should be an array of file paths.

### distDir

Specifies the project directory where compiled distributable files are saved.

### eventstoreAdapter

Specifies an adapter used to connect to to the application's event store. An adapter configuration object contains the following fields:

| Field   | Description                                                         |
| ------- | ------------------------------------------------------------------- |
| module  | The name of a module or the path to a file that defines an adapter. |
| options | An object that defines the adapter's options as key-value pairs     |

##### Example:

```js
eventstoreAdapter: {
  module: 'resolve-eventstore-lite',
  options: {
    databaseFile: ':memory:'
  }
}
```

### eventBroker

Specifies settings of the application's event broker. Use these settings to set up a reSolve application in a distributed environment. The configuration object contains the following fields:

| Field            | Description                                                                                                                                            |
| ---------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| launchBroker     | A boolean value that specifies whether to launch an event broker in the current instance.                                                              |
| publisherAddress | The URL of the event publisher instance.                                                                                                               |
| consumerAddress  | The URL of the event consumer instance.                                                                                                                |
| databaseFile     | The path to a database file used by the event broker.                                                                                                  |
| upstream         | Specifies whether or not the current instance can produce events. If set to `false`, the instance can only consume events produced by other instances. |

### jwtCookie

Specifies global settings for the application's JWT cookies. The configuration object contains the following fields:

| Field  | Description                                    |
| ------ | ---------------------------------------------- |
| name   | The cookie's name.                             |
| maxAge | The value of the cookie's `max-age` attribute. |

```js
jwtCookie: {
  name: 'jwt',
  maxAge: 31536000000
}
```

### mode

Specifies webpacks's `mode` configuration.

Supported values:

- `development`
- `production`
- `none`

### port

Specifies the server application's port as an integer or string.

### readModels

An array of the application's Read Models. A Read Model configuration object within this array contains the following fields:

| Field         | Description                                                          |
| ------------- | -------------------------------------------------------------------- |
| name          | The Read Model's name                                                |
| projection    | A path to a file that defines Read Model projection.                 |
| resolvers     | A path to a file that defines Read Model resolver.                   |
| connectorName | The name of a connector used to connect the Read Model to its store. |

##### Example:

```js
readModels: [
  {
    name: 'ShoppingLists',
    projection: 'common/read-models/shopping_lists.projection.js',
    resolvers: 'common/read-models/shopping_lists.resolvers.js',
    connectorName: 'default'
  }
]
```

### readModelConnectors

Specifies the application's Read Model connectors a key-value pairs. A connector configuration object contains the following fields:

| Field   | Description                                                          |
| ------- | -------------------------------------------------------------------- |
| module  | The name of a module or the path to a file that defines a connector. |
| options | An object that defines the connector's options as key-value pairs    |

##### Example:

```js
readModelConnectors: {
  default: {
    module: 'resolve-readmodel-mysql',
    options: {
      host: 'localhost',
      port: 3306,
      user: 'root',
      password: '',
      database: 'ReadModelStoriesSample'
    }
  }
}
```

### sagas

Specifies an array of the application's Sagas. A Saga configuration object within this array contains the following fields:

| Field         | Description                                                                                 |
| ------------- | ------------------------------------------------------------------------------------------- |
| source        | A path to a file that defines the Saga's handlers or both handlers and side effects.        |
| sideEffects   | A path to a file that defines the Saga's side effects.                                      |
| connectorName | Defines a Read Model storage used to store the saga's persistent data.                      |
| schedulerName | Specifies the scheduler that should be used to schedule command execution.                  |
| encryption    | A path to a file that defines data encryption and decryption logic.                         |

##### Example:

<!-- prettier-ignore-start -->

[mdis]:# (../tests/saga-sample/config.js#app-config)
```js
const appConfig = {
  sagas: [
    {
      name: 'UserConfirmation',
      source: 'saga.js',
      connectorName: 'default',
      schedulerName: 'scheduler'
    }
  ]
}
```

<!-- prettier-ignore-end -->

### schedulers

Specifies saga schedulers as key-value pairs. A scheduler configuration object contains the following fields:

| Field         | Description                                                 |
| ------------- | ----------------------------------------------------------- |
| adapter       | The **scheduler adapter** settings.                         |
| connectorName | The name of the readModel connector used by this scheduler. |

A scheduler adapter configuration object has the following fields:

| Field   | Description                                                         |
| ------- | ------------------------------------------------------------------- |
| module  | The name of a module or the path to a file that defines an adapter. |
| options | An object that defines the adapter's options as key-value pairs     |

##### Example:

<!-- prettier-ignore-start -->

[mdis]:# (../tests/saga-sample/config.js#schedulers-config)
```js
schedulers: {
  scheduler: {
    adapter: {
      module: 'resolve-scheduler-local',
      options: {}
    },
    connectorName: 'default'
  }
},
```

<!-- prettier-ignore-end -->

### serverImports

Same as [clientImports](#clientImports) but affects the client script invoked on the server by the Server Side Rendering (SSR) script.

### staticDir

Specifies the project directory that contains static files.

### staticPath

Specifies the URL path to static files.

### target

Specifies the environment that the application targets.

Supported values:

- `"local"`
- `"cloud"`

### viewModels

Specifies an array of the application's View Models. A View Model configuration object within this array contains the following fields:

| Field            | Description                                                         |
| ---------------- | ------------------------------------------------------------------- |
| name             | The View Model's name.                                              |
| projection       | A path to a file that defines View Model projection.                |
| serializeState   | A path to a file that defines a state serializer function.          |
| deserializeState | A path to a file that defines a state deserializer function.        |
| encryption       | A path to a file that defines data encryption and decryption logic. |

```js
viewModels: [
  {
    name: 'shoppingList',
    projection: 'common/view-models/shopping_list.projection.js'
  }
]
```
