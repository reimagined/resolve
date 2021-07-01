---
id: advanced-techniques
title: Advanced Techniques
description: "This document describes advanced techniques that can help уou extend your reSolve application's functionality."
---

## Splitting Code Into Chunks

ReSolve uses [webpack](https://webpack.js.org/) to transpile and bundle the application code so it can run on client browsers, the server and serverless platforms.

ReSolve takes advantage of webpack's code splitting functionality to split the bundles into chunks. A chunk can be server-only (for business logic), browser-only (for UI and client logic) or isomorphic (for view models on the server side and Redux reducers on the client).

When you build a reSolve application, the following chunks are generated:

- Command processor code - aggregate command handlers and projections (server only)
- View model projection (isomorphic)
- Read model projections and resolvers (server only)
- API handlers (server only)
- SSR renderer (server only, with peer dependencies with client, such as `styled-components`)
- The client application with UI (browser only)

All these chunks are used by the target application. Some chunks can include other chunks. For instance, the client includes the view model projection chunk to automatically generate Redux reducers.

In a cloud/serverless environment, chunks like read model projections & resolvers, SSR renderer, API handlers and REST business logic are distributed to appropriate cloud executors.

When an application runs locally, the `@resolve-js/scripts` utility loads all necessary chunks and combines them with the runtime code.

## Adapters

ReSolve uses the **adapter** mechanism to provide an abstraction layer above APIs used by its subsystems. For instance, adapters are used to define how a reSolve application stores its data. This allows reSolve to abstract away all direct interactions with the underlying storage and expose a unified data management API.

ReSolve uses different types of adapters depending on which kind of data needs to be stored.

- **Event store adapters**
- **Read model store adapters**

Resolve includes a set of adapters compatible with popular Database Management Systems (DBMS). You can also implement new adapters to store data in any required way.

Note that reSolve does not force you to use adapters. For example, you may need to implement a Read Model on top of some arbitrary system, such as a full-text-search engine, OLAP or a particular SQL database. In such case, you can just work with that system in the code of the projection function and query resolver, without writing a new Read Model adapter.

## Custom Read Model Connectors

You can implement a custom Read Model connector to define how a Read Model's data is stored. A connector implements the following functions:

- **connect** - Initializes a connection to a storage.
- **disconnect** - Closes the storage connection.
- **drop** - Removes the Read Model's data from storage.
- **dispose** - Forcefully disposes all unmanaged resources used by Read Models served by this connector.

The code sample below demonstrates how to implement a connector that provides a file-based storage for Read Models.

##### common/read-models/custom-read-model-connector.js:

<!-- prettier-ignore-start -->

[mdis]:# (../tests/custom-readmodel-sample/connector.js)
```js
import fs from 'fs'

const safeUnlinkSync = filename => {
  if (fs.existsSync(filename)) {
    fs.unlinkSync(filename)
  }
}

export default options => {
  const prefix = String(options.prefix)
  const readModels = new Set()
  const connect = async readModelName => {
    fs.writeFileSync(`${prefix}${readModelName}.lock`, true, { flag: 'wx' })
    readModels.add(readModelName)
    const store = {
      get() {
        return JSON.parse(String(fs.readFileSync(`${prefix}${readModelName}`)))
      },
      set(value) {
        fs.writeFileSync(`${prefix}${readModelName}`, JSON.stringify(value))
      }
    }
    return store
  }
  const disconnect = async (store, readModelName) => {
    safeUnlinkSync(`${prefix}${readModelName}.lock`)
    readModels.delete(readModelName)
  }
  const drop = async (store, readModelName) => {
    safeUnlinkSync(`${prefix}${readModelName}.lock`)
    safeUnlinkSync(`${prefix}${readModelName}`)
  }
  const dispose = async () => {
    for (const readModelName of readModels) {
      safeUnlinkSync(`${prefix}${readModelName}.lock`)
    }
    readModels.clear()
  }
  return {
    connect,
    disconnect,
    drop,
    dispose
  }
}
```

<!-- prettier-ignore-end -->

A connector is defined as a function that receives an `options` argument. This argument contains a custom set of options that you can specify in the connector's configuration.

Register the connector in the application's configuration file.

##### config.app.js:

```js
readModelConnectors: {
  customReadModelConnector: {
    module: 'common/read-models/custom-read-model-connector.js',
    options: {
      prefix: path.join(__dirname, 'data') + path.sep // Path to a folder that contains custom Read Model store files
    }
  }
}
```

Now you can assign the custom connector to a Read Model by name as shown below.

##### config.app.js:

```js
  readModels: [
    {
      name: 'CustomReadModel',
      projection: 'common/read-models/custom-read-model.projection.js',
      resolvers: 'common/read-models/custom-read-model.resolvers.js',
      connectorName: 'customReadModelConnector'
    }
    ...
  ]
```

The code sample below demonstrates how you can use the custom store's API in the Read Model's code.

##### common/read-models/custom-read-model.projection.js:

<!-- prettier-ignore-start -->

[mdis]:# (../tests/custom-readmodel-sample/projection.js)
```js
const projection = {
  Init: async store => {
    await store.set(0)
  },
  INCREMENT: async (store, event) => {
    await store.set((await store.get()) + event.payload)
  },
  DECREMENT: async (store, event) => {
    await store.set((await store.get()) - event.payload)
  }
}

export default projection
```

<!-- prettier-ignore-end -->

##### common/read-models/custom-read-model.resolvers.js:

<!-- prettier-ignore-start -->

[mdis]:# (../tests/custom-readmodel-sample/resolvers.js)
```js
const resolvers = {
  read: async store => {
    return await store.get()
  }
}

export default resolvers
```

<!-- prettier-ignore-end -->

## Modules

In reSolve, a module encapsulates a fragment of functionality that can be included by an application. A module can include any structural parts of a reSolve application in any combination.

A module is a standalone configuration object that can reference client code, read-side and write-side code, sagas and HTTP handlers. To include a module into your application, you need to initialize this object with any required additional settings and merge it into your application's centralized config:

##### run.js:

<!-- prettier-ignore-start -->

[embedmd]:# (../examples/js/hacker-news/run.js /^[[:blank:]]+const moduleAuth/ /^[[:blank:]]+\)/)
```js
  const moduleAuth = resolveModuleAuth([
    {
      name: 'local-strategy',
      createStrategy: 'auth/create_strategy.js',
      logoutRoute: {
        path: 'logout',
        method: 'POST'
      },
      routes: [
        {
          path: 'register',
          method: 'POST',
          callback: 'auth/route_register_callback.js'
        },
        {
          path: 'login',
          method: 'POST',
          callback: 'auth/route_login_callback.js'
        }
      ]
    }
  ])

  const baseConfig = merge(
    defaultResolveConfig,
    appConfig,
    moduleComments,
    moduleAuth
  )
```

<!-- prettier-ignore-end -->

A merged module's code is included in the resulting application's bundles.

For an example on how to use modules, see the [Hacker News](https://github.com/reimagined/resolve/tree/master/examples/js/hacker-news) sample application. This application uses the authentication and comments modules from reSolve.

## Encryption

The reSolve framework includes a mechanism that allows you to use an arbitrary encryption algorithm to encrypt the stored events and Read Model state data. You can use this functionality to store user data in compliance with General Data Protection Regulation (GDPR).

Encryption is defined in a file that exports a factory function of the following format:

##### Aggregate Encryption:

```js
// common/aggregates/encryption.js
const createEncryption = (aggregateId, context) => {
  ...
  // Returns an object that contains 'encrypt' and 'decrypt' functions
  return {
    encrypt: (data) => ..., // A function that takes data and returns its encrypted version
    decrypt: (blob) => ..., // A function that takes an encrypted blob and returns unencrypted data
  }
}
export default createEncryption
```

##### Read Model Encryption:

```js
// common/read-models/encryption.js
const createEncryption = (event, context) => {
  ...
  // Returns an object that contains 'encrypt' and 'decrypt' functions
  return {
    encrypt: (data) => ..., // A function that takes data and returns its encrypted version
    decrypt: (blob) => ..., // A function that takes an encrypted blob and returns unencrypted data
  }
}
export default createEncryption
```

You can assign encryption to aggregates and read models in the application's configuration file as shown below:

```js
const appConfig = {
  aggregates: [
    {
      name: 'user-profile',
      commands: 'common/aggregates/user-profile.commands.js',
      projection: 'common/aggregates/user-profile.projection.js',
      encryption: 'common/aggregates/encryption.js', // The path to a file that defines aggregate encryption
    },
    ...
  ]
  readModels: [
    {
      name: 'user-profiles',
      connectorName: 'default',
      projection: 'common/read-models/user-profiles.projection.js',
      resolvers: 'common/read-models/user-profiles.resolvers.js',
      encryption: 'common/read-models/encryption.js', // The path to a file that defines Read Model encryption
    },
    ...
  ],
  ...
}
```

### Storing Secrets

The reSolve framework implements a **secrets manager** that you can use to get, set or delete secrets based on their unique IDs. In an encryption factory function, you can access the secrets manager through the reSolve context object:

```js
// common/aggregates/encryption.js
import { generate } from 'generate-password'

const createEncryption = (aggregateId, context) => {
  const { secretsManager } = context
  let aggregateKey = await secretsManager.getSecret(aggregateId)
  if (!aggregateKey) {
    aggregateKey = generate({
      length: 20,
      numbers: true,
    })
    await secretsManager.setSecret(aggregateId, aggregateKey)
  }
  ...
}
```

The `secretsManager` object contains the following functions:

| Function Name  | Description                                                                                                                               |
| -------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| `getSecret`    | Takes a unique ID as an argument and returns a promise that resolves to a string if a secret was found or null if a secret was not found. |
| `setSecret`    | Takes a unique ID and a secret string as arguments and returns a promise that resolves if the secret was successfully saved.              |
| `deleteSecret` | Takes a unique ID as an argument and returns a promise that resolves if the secret was successfully deleted.                              |

> **NOTE:** The unique ID of an existing or deleted secret cannot be reused. If you pass a previously used ID to the `setSecret` function, an exception is raised.

The secrets manager stores secrets in the 'secrets' table within the event store. To change the table name, use the event store adapter's `secretsTableName` option:

```js
// config.prod.js
const prodConfig = {
  eventstoreAdapter: {
    module: '@resolve-js/eventstore-lite',
    options: {
      databaseFile: 'data/event-store.db',
      secretsTableName: 'usersecrets',
    },
  },
}
```

#### Example

The **personal-data** example demonstrates how to store encrypted user data. In this example, the encryption logic is implemented in a separate `common/encryption-factory.js` file and reused on both the read and write sides.

## Upload Files

The **@resolve-js/module-uploader** module implements the file upload functionality. You can enable this module as shown below:

##### run.js:

```js
import resolveModuleUploader from '@resolve-js/module-uploader'
const moduleUploader = resolveModuleUploader({ jwtSecret })
...
const baseConfig = merge(
  defaultResolveConfig,
  appConfig,
  moduleAuth,
  moduleUploader
)
```

The **@resolve-js/module-uploader** module adds the following API endpoints to an application:

- `/api/uploader/getFormUpload` - Returns an upload path to use in HTTP forms.
- `/api/uploader/getUploadUrl` - Returns a path used to upload files.
- `/api/uploader/getToken` - Takes user credentials and returns the user's authorization token.

The [personal-data](https://github.com/reimagined/resolve/tree/master/examples/js/personal-data) example application uses the **@resolve-js/module-uploader** module to upload images.

## Import-export

Each event store adapter exposes the following API used for event export and import:

| Method | Description                                                           |
| ------ | --------------------------------------------------------------------- |
| export | Returns a readable stream used to export events from an event store.  |
| import | Returns a writeable stream used to import events into an event store. |

In the code sample below, a readable stream returned by an event store's `export` method is pipelined directly into a writable stream returned by a recipient event store's `import` method.

##### Example

```js
import { Readable, pipeline as pipelineC } from 'stream'

import createEventStoreAdapter from '@resolve-js/eventstore-lite'

const pipeline = promisify(pipelineC)

const eventStore1 = createEventStoreAdapter({
  databaseFile: './data/event-store-1.db',
})

const eventStore2 = createEventStoreAdapter({
  databaseFile: './data/event-store-2.db',
})

await pipeline(eventStore1.export(), eventStore2.import())
```

## Incremental import

Incremental import allows you to import into an event store only those events that do not already exist in this event store. Incremental import also skips events that are older (i.e., have an older timestamp) than the latest event in the recipient event store.

### Basic Incremental Import

To import events incrementally, pass an array of events to an event store adapter's [incrementalImport](api/event-store-adapter.md#incrementalimport) method.

The code sample below implements an API endpoint that incrementally imports events into the application's event store.

##### Example API handler

```js
import iconv from 'iconv-lite'

async function handler(req, res) {
  const bodyCharset = (
    bodyOptions.find((option) => option.startsWith('charset=')) ||
    'charset=utf-8'
  ).substring(8)

  if (bodyCharset !== 'utf-8') {
    bodyContent = iconv.decode(iconv.encode(bodyContent, 'utf-8'), bodyCharset)
  }

  const events = JSON.parse(body)

  await req.resolve.eventstoreAdapter.incrementalImport(events)
}

export default handler
```

### Advanced Incremental import

The following methods give you additional control over the incremental import process:

| Method                                                                            | Description                                         |
| --------------------------------------------------------------------------------- | --------------------------------------------------- |
| [beginIncrementalImport](api/event-store-adapter.md#beginincrementalimport)       | Starts to accumulate events for incremental import. |
| [pushIncrementalImport](api/event-store-adapter.md#pushincrementalimport)         | Accumulates events for incremental import.          |
| [commitIncrementalImport](api/event-store-adapter.md#commitincrementalimport)     | Commits the accumulated events to the event store.  |
| [rollbackIncrementalImport](api/event-store-adapter.md#rollbackincrementaiImport) | Drops the accumulated events.                       |

The code sample below demonstrates how to use advanced incremental import in a try-catch block to roll back in case of errors.

##### Example

```js
try {
  const importId = await eventStoreAdapter.beginIncrementalImport()
  await eventStoreAdapter.pushIncrementalImport(events, importId)
  await eventStoreAdapter.commitIncrementalImport(importId)
} catch (error) {
  await eventStoreAdapter.rollbackIncrementalImport()
  throw error
}
```
