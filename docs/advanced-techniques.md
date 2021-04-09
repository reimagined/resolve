---
id: advanced-techniques
title: Advanced Techniques
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

ReSolve uses the **adapter** mechanism to provide an abstraction layer above APIs used by its subsystems. For instance, adapters are used to define how a reSolve application stores its data. They abstract away all direct interactions with the underlying storage, allowing reSolve to provide a unified data management API.

ReSolve uses different types of adapters depending on which kind of data needs to be stored.

- **Event store adapters**
- **Read model store adapters**

Resolve comes with a set of adapters covering popular DBMS choices. You can also implement new adapters to store data in any required way.

Note that reSolve does not force you to use adapters. For example, you may need to implement a Read Model on top of some arbitrary system, such as a full-text-search engine, OLAP or a particular SQL database. In such case, you can just work with that system in the code of the projection function and query resolver, without writing a new Read Model adapter.

## Modules

In reSolve, a module encapsulates a fragment of functionality that can be included by an application. A module can include any structural parts of a reSolve application in any combination.

A module is a standalone configuration object that can reference client code, read-side and write-side code, sagas and HTTP handlers. To include a module into your application, you need to initialize this object with any required additional settings and merge it into your application's centralized config:

##### run.js:

<!-- prettier-ignore-start -->

[embedmd]:# (../examples/hacker-news/run.js /^[[:blank:]]+const moduleAuth/ /^[[:blank:]]+\)/)
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

For an example on how to use modules, see the [Hacker News](https://github.com/reimagined/resolve/tree/master/examples/hacker-news) sample application. This application uses the authentication and comments modules from reSolve.

## Encryption

The reSolve framework provides a mechanism that allows you to use an arbitrary encryption algorithm to encrypt the stored events and Read Model state data.

This functionality is critical when storing user personal data in compliance with General Data Protection Regulation (GDPR)

Encryption is defined as a file that exports a factory function of the following format:

##### Aggregate Encryption:

```js
const createEncryption = (aggregateId, context) => {
  ...
  // Returns an object that contains an 'encrypt' and 'decrypt' functions
  return {
    encrypt: (data) => ..., // A function that takes data and returns its encrypted version
    decrypt: (blob) => ..., // A function takes an encrypted blob and returns unencrypted data
  }
}
export default createEncryption
```

##### Read Model Encryption:

```js
const createEncryption = ( event, context) => {
  ...
  // Returns an object that contains an 'encrypt' and 'decrypt' functions
  return {
    encrypt: (data) => ..., // A function that takes data and returns its encrypted version
    decrypt: (blob) => ..., // A function takes an encrypted blob and returns unencrypted data
  }
}
export default createEncryption
```

You can assign encryption to aggregates and Read Models in the application's configuration file as shown below:

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

The reSolve framework implements a **secrets manager** that you can use to store and access secrets based on aggregate ID in you encryption implementation. The secret manager is available through the reSolve context object:

```js
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

The `secretsManager` object exposes the following functions:

| Function Name  | Description                                                                                                                          |
| -------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| `getSecret`    | Takes a unique ID as an argument and returns a promise that resolves to a string or null if the secret was not found.                |
| `setSecret`    | Takes a unique ID and a secret string as arguments and returns a promise that resolves to null if the secret was successfully saved. |
| `deleteSecret` | Takes a unique ID as an argument and returns a promise that resolves to null if the secret was successfully deleted.                 |

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

The [cli-uploader](https://github.com/reimagined/resolve/tree/master/examples/cli-uploader) example application demonstrates how to design a file uploader utility and handle file uploads on the server.

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

To import events incrementally, pass an array of events to an event store adapter's [incrementalImport](api-reference.md#incrementalimport) method.

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

| Method                                                                  | Description                                         |
| ----------------------------------------------------------------------- | --------------------------------------------------- |
| [beginIncrementalImport](api-reference.md#beginincrementalimport)       | Starts to accumulate events for incremental import. |
| [pushIncrementalImport](api-reference.md#pushincrementalimport)         | Accumulates events for incremental import.          |
| [commitIncrementalImport](api-reference.md#commitincrementalimport)     | Commits the accumulated events to the event store.  |
| [rollbackIncrementalImport](api-reference.md#rollbackincrementaiImport) | Drops the accumulated events.                       |

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
