---
id: application-configuration
title: Application Configuration
description: This document lists configuration options available for a reSolve application.
---

## Overview

This document describes configuration options available for a reSolve application.

In a new reSolve application, configuration settings are split across the following files for different run targets:

- **config.app.js** - Contains general app configuration settings. In this file, you should register the application's aggregates, Read Models and View Models.
- **config.cloud.js** - Contains configuration settings that target the reSolve Cloud environment.
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
} from '@resolve-js/scripts'
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

Refer to the [JSON schema](https://github.com/reimagined/resolve/blob/master/packages/core/@resolve-js/scripts/configs/schema.resolve.config.json) file to familiarize yourself with the definition of the configuration object's structure.

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
    projection: 'common/aggregates/shopping_list.projection.js',
  },
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
    method: 'GET',
  },
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
      target: 'node',
    },
  ],
  [
    'client/ssr.js',
    {
      outputFile: 'common/cloud-entry/ssr.js',
      moduleType: 'commonjs',
      target: 'node',
    },
  ],
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
      module: '@resolve-js/runtime/lib/common/handlers/live-require-handler.js',
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
  module: '@resolve-js/eventstore-lite',
  options: {
    databaseFile: ':memory:'
  }
}
```

The following adapters are available:

| Adapter Module                                                                    | Description                                               |
| --------------------------------------------------------------------------------- | --------------------------------------------------------- |
| [@resolve-js/eventstore-lite](#eventstore-lite)                                   | Used to store events in an SQLite database.               |
| [@resolve-js/eventstore-mysql](#eventstore-mysql)                                 | Used to store events in a MySQL database.                 |
| [@resolve-js/eventstore-postgresql](#eventstore-postgresql)                       | Used to store events in a PostgreSQL database.            |
| [@resolve-js/eventstore-postgresql-serverless](#eventstore-postgresql-serverless) | Used to store events in AWS Aurora PostgreSQL Serverless. |

#### eventstore-lite

Used to store events in an SQLite database.

This adapter supports the following options:

| Option Name        | Description                                                                                                                                                                  |
| ------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| databaseFile       | Specifies the path to a database file used to store events. If set to `':memory:'`, all data is stored in memory and is lost when the application is shut down or restarted. |
| secretsTableName   | The name of a database table used to store secrets.                                                                                                                          |
| snapshotBucketSize | The number of events between aggregate snapshots.                                                                                                                            |

##### Example

```js
const prodConfig = {
  eventstoreAdapter: {
    module: '@resolve-js/eventstore-lite',
    options: {
      databaseFile: 'data/event-store.db'
      // databaseFile: ':memory:'
    },
  },
  ...
}
```

#### eventstore-mysql

Used to store events in a MySQL database.

To configure the database connection for this adapter, specify [MySQL connection setting](https://www.npmjs.com/package/mysql2#first-query) as the adapter's options. Additionally, you can specify the following options:

| Option Name        | Description                                         |
| ------------------ | --------------------------------------------------- |
| eventsTableName    | The name of a database table used to store events.  |
| secretsTableName   | The name of a database table used to store secrets. |
| snapshotBucketSize | The number of events between aggregate snapshots.   |

##### Example

```js
const prodConfig = {
  eventstoreAdapter: {
    module: '@resolve-js/eventstore-mysql',
    options: {
      host: 'localhost',
      port: 3306,
      user: 'customUser',
      password: 'customPassword',
      database: 'customDatabaseName',
      eventsTableName: 'customTableName',
    }
  },
  ...
}
```

#### eventstore-postgresql

Used to store events in a PostgreSQL database.

This adapter supports the following options:

| Option Name        | Description                                          |
| ------------------ | ---------------------------------------------------- |
| database           | The name of a database.                              |
| databaseName       | The name of a PostgreSQL database schema.            |
| eventsTableName    | The name of a database table used to store events.   |
| host               | The database server host name.                       |
| password           | The user's password.                                 |
| port               | The database server port number.                     |
| secretsTableName   | The name of a database table used to store secrets.  |
| snapshotBucketSize | The number of events between aggregate snapshots.    |
| user               | The user name used to log in to the database server. |

##### Example

```js
const prodConfig = {
  eventstoreAdapter: {
    module: '@resolve-js/eventstore-postgresql',
    options: {
      user: 'user',
      password: 'password',
      database: 'postgres',
      host: 'localhost',
      port: 5432,
      databaseName: 'public',
      eventsTableName: 'events',
    }
  },
  ...
}
```

#### eventstore-postgresql-serverless

Used to store events in AWS Aurora PostgreSQL Serverless.

This adapter supports the following options:

| Option Name            | Description                                                      |
| ---------------------- | ---------------------------------------------------------------- |
| awsSecretStoreArn      | An AWS secret store's Amazon Resource Name (ARN)                 |
| databaseName           | The name of a database.                                          |
| dbClusterOrInstanceArn | An Amazon Resource Name (ARN) of a database cluster or instance. |
| eventsTableName        | The name of a database table used to store events.               |
| region                 | An AWS region.                                                   |
| secretsTableName       | The name of a database table used to store secrets.              |
| snapshotBucketSize     | The number of events between aggregate snapshots.                |

##### Example

```js
const prodConfig = {
  eventstoreAdapter: {
    module: '@resolve-js/eventstore-postgresql-serverless',
    options: {
      region: 'us-east-1',
      databaseName: 'databaseName',
      eventsTableName: 'eventsTableName',
      awsSecretStoreArn: 'awsSecretStoreArn',
      dbClusterOrInstanceArn: 'dbClusterOrInstanceArn',
    }
  },
  ...
}
```

### middleware

Specifies [middleware](middleware.md) for aggregates and read models. The configuration object can contain the following fields:

| Field     | Description                                                                                          |
| --------- | ---------------------------------------------------------------------------------------------------- |
| aggregate | An array of file paths. Each value in the array specifies a file that exports a middleware function. |
| readModel | An object that contains read model middleware settings (see below).                                  |

The **readModel** object can have the following fields:

| Field      | Description                                                |
| ---------- | ---------------------------------------------------------- |
| projection | Lists files that contain read model projection middleware. |
| resolver   | Lists files that contain read model resolver middleware.   |

Middlewares of all types are invoked in the order that they are listed in the configuration object.

#### Example

```js
const appConfig = {
  ...
  middlewares: {
    aggregate: [
      'common/middlewares/command-middleware-1.js',
      'common/middlewares/command-middleware-2.js',
      'common/middlewares/command-middleware-3.js'
    ],
    readModel: {
        projection: ['common/middlewares/projection-middleware.js'],
        resolver: ['common/middlewares/resolver-middleware.js']
    }
  },
  ...
}
```

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

### name

Specifies the application's name.

By default, the value is the same as the package name defined in the application's package.json file.

### port

Specifies the server application's port as an integer or string.

### readModels

An array of the application's Read Models. A Read Model configuration object within this array contains the following fields:

| Field         | Description                                                          |
| ------------- | -------------------------------------------------------------------- |
| name          | The Read Model's name                                                |
| projection    | A path to a file that defines a Read Model projection.               |
| resolvers     | A path to a file that defines a Read Model resolver.                 |
| connectorName | The name of a connector used to connect the Read Model to its store. |

##### Example:

```js
readModels: [
  {
    name: 'ShoppingLists',
    projection: 'common/read-models/shopping_lists.projection.js',
    resolvers: 'common/read-models/shopping_lists.resolvers.js',
    connectorName: 'default',
  },
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
    module: 'readmodel-mysql',
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

The following connectors are available:

| Module Name                                                                     | Description                                                           |
| ------------------------------------------------------------------------------- | --------------------------------------------------------------------- |
| [@resolve-js/readmodel-lite](#readmodel-lite)                                   | Used to store Read Model data in an SQLite database.                  |
| [@resolve-js/readmodel-mysql](#readmodel-mysql)                                 | Used to store Read Model data in a MySQL database.                    |
| [@resolve-js/readmodel-postgresql](#readmodel-postgresql)                       | Used to store Read Model data in a PostgreSQL database.               |
| [@resolve-js/readmodel-postgresql-serverless](#readmodel-postgresql-serverless) | Used to store Read Model data in Amazon Aurora PostgreSQL Serverless. |

#### readmodel-lite

Used to store Read Model data in an SQLite database.

This connector supports the following options:

| Option Name  | Description                                                                                                                                                                           |
| ------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| databaseFile | Specifies the path to a database file used to store Read Model data. If set to `':memory:'`, all data is stored in memory and is lost when the application is shut down or restarted. |

##### Example

```js
const prodConfig = {
  readModelConnectors: {
    default: {
      module: '@resolve-js/readmodel-lite',
      options: {
        databaseFile: 'data/read-models.db'
        // databaseFile: ':memory:'
      },
    },
  },
  ...
}
```

#### readmodel-mysql

Used to store Read Model data in a MySQL database.

To configure the database connection for this adapter, specify [MySQL connection setting](https://www.npmjs.com/package/mysql2#first-query) as the adapter's options.

##### Example

```js
const prodConfig = {
  readModelConnectors: {
    default: {
      module: '@resolve-js/readmodel-mysql',
      options: {
        host: 'localhost',
        port: 3306,
        user: 'customUser',
        password: 'customPassword',
        database: 'customDatabaseName'
      }
    }
  },
  ...
}
```

#### readmodel-postgresql

Used to store Read Model data in a PostgreSQL database.

This connector supports the following options:

| Option Name  | Description                                          |
| ------------ | ---------------------------------------------------- |
| database     | The name of a database.                              |
| databaseName | The name of a PostgreSQL database schema.            |
| host         | The database server host name.                       |
| password     | The user's password.                                 |
| port         | The database server port number.                     |
| tablePrefix  | Optional table name prefix.                          |
| user         | The user name used to log in to the database server. |

##### Example

```js
const prodConfig = {
  readModelConnectors: {
    default: {
      module: '@resolve-js/readmodel-postgresql',
      options: {
        user: 'user',
        password: 'password',
        database: 'postgres',
        host: 'localhost',
        port: 5432,
        databaseName: 'public',
      }
    }
  },
  ...
}
```

#### readmodel-postgresql-serverless

Used to store Read Model data in AWS Aurora PostgreSQL Serverless.

This connector supports the following options:

| Option Name            | Description                                                      |
| ---------------------- | ---------------------------------------------------------------- |
| awsSecretStoreArn      | An AWS secret store's Amazon Resource Name (ARN)                 |
| databaseName           | The name of a database.                                          |
| dbClusterOrInstanceArn | An Amazon Resource Name (ARN) of a database cluster or instance. |
| region                 | An AWS region.                                                   |
| tablePrefix            | Optional table name prefix.                                      |

#### Example

```js
const prodConfig = {
  readModelConnectors: {
    default: {
      module: '@resolve-js/readmodel-postgresql-serverless',
      options: {
        region: 'us-east-1',
        databaseName: 'databaseName',
        awsSecretStoreArn: 'awsSecretStoreArn',
        dbClusterOrInstanceArn: 'dbClusterOrInstanceArn',
      }
    }
  },
  ...
}
```

### sagas

Specifies an array of the application's Sagas. A Saga configuration object within this array contains the following fields:

| Field         | Description                                                                          |
| ------------- | ------------------------------------------------------------------------------------ |
| source        | A path to a file that defines the Saga's handlers or both handlers and side effects. |
| sideEffects   | A path to a file that defines the Saga's side effects.                               |
| connectorName | Defines a Read Model storage used to store the saga's persistent data.               |
| encryption    | A path to a file that defines data encryption and decryption logic.                  |

##### Example:

<!-- prettier-ignore-start -->

[mdis]:# (../tests/saga-sample/config.js#app-config)
```js
const appConfig = {
  sagas: [
    {
      name: 'UserConfirmation',
      source: 'saga.js',
      connectorName: 'default'
    }
  ]
}
````

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

| Field            | Description                                                                              |
| ---------------- | ---------------------------------------------------------------------------------------- |
| name             | The View Model's name.                                                                   |
| projection       | A path to a file that defines a View Model projection.                                   |
| resolver         | A path to a file that defines a [View Model resolver](read-side.md#view-model-resolver). |
| serializeState   | A path to a file that defines a state serializer function.                               |
| deserializeState | A path to a file that defines a state deserializer function.                             |
| encryption       | A path to a file that defines data encryption and decryption logic.                      |

```js
viewModels: [
  {
    name: 'shoppingList',
    projection: 'common/view-models/shopping_list.projection.js',
  },
]
```
