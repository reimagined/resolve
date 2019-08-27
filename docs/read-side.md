---
id: read-side
title: Read Side
---

## Read Models

The reSolve framework's read side listens to events that the write side produces. Based on **these** events, the read side updates the **Read Models**, and these models provide data to the queries.

A Read Model is defined by a set of projection functions and query resolver functions.

- **[Projection functions](#updating-a-read-model-via-projection-functions)** build a Read Models state based on incoming events.
- **[Query resolvers](#resolvers)** use data from the accumulated state to answer queries.

ReSolve also supports **View Models**. A View Model is a Read Model that can be built on the fly, sent to the client and kept there up-to-date. Refer to the [View Model Specifics](view-model-specifics) section for more information.

## Configuring Read Models and View Models

### Configuring Read Models

All of the application's Read Models should be registered in the **config.app.js** file's **readModels** section:

```js
const appConfig = {
  ...
  readModels: [
    {
      name: 'default',
      projection: 'common/read-models/default.projection.js',
      resolvers: 'common/read-models/default.resolvers.js',
      connectorName: 'default'
    }
  ],
}
```

In the configuration object, specify the Read Model's name and the paths to the files containing projections, resolvers, and the Read Model connector's name.

A Read Model connector defines how a Read Model's data should be stored. You can define the available connectors in the **readModelConnectors** section:

##### config.dev.js:

```js
const devConfig = {
  ...
  readModelConnectors: {
    default: {
      module: 'resolve-readmodel-lite',
      options: {}
    }
  },
}
```

##### config.prod.js:

```js
import { declareRuntimeEnv } from 'resolve-scripts'
const prodConfig = {
  ...
  readModelConnectors: {
    default: {
      module: 'resolve-readmodel-mysql',
      options: {
        host: declareRuntimeEnv('RESOLVE_READMODEL_SQL_HOST'),
        database: declareRuntimeEnv('RESOLVE_READMODEL_SQL_DATABASE'),
        user: declareRuntimeEnv('RESOLVE_READMODEL_SQL_USER'),
        password: declareRuntimeEnv('RESOLVE_READMODEL_SQL_PASSWORD'),
      }
    }
  },
}
```

### Configuring View Models

Register your View Models in the **viewModels** configuration section:

```js
const appConfig = {
  ...
  viewModels: [
    {
      name: 'storyDetails',
      projection: 'common/view-models/story_details.projection.js',
      serializeState: 'common/view-models/story_details.serialize_state.js',
      deserializeState: 'common/view-models/story_details.deserialize_state.js',
      snapshotAdapter: {
        module: 'common/view-models/snapshot_adapter.module.js',
        options: {
          databaseFile: 'snapshot.db',
        }
      }
    }
  ]
}
```

In the configuration object, specify the View Model's name and the path to the file containing projection definition. You can also specify the View Model snapshot storage adapter. Use the **serializeState** and **deserializeState** options to specify paths to a View Model's serializer and deserializer functions.

### Custom Read Models

To create a custom Read Model, you need to manually implement a Read Model connector. A connector defines functions that manage a custom Read Model's store. The following functions can be defined:

- **connect** - Initialises a connection to a storage.
- **disconnect** - Closes the storage connection.
- **drop** - Removes the Read Model's data from storage.
- **dispose** - Forcefully disposes all unmanaged resources used by Read Models served by this connector.

The code sample below demostrates how to implement a connector that provides a file-based storage for Read Models.

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

The code sample below demostrates how you can use the custom store's API in the Read Model's code.

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

## Initialize a Read Model

Each Read Model projection object should define an **Init** function that initializes the Read Model storage.

You can use the **defineTable** method to add tables to the storage:

```js
  Init: async store => {
    ...
    await store.defineTable('Comments', {
      indexes: { id: 'string' },
      fields: [
        'text',
        'parentId',
        'comments',
        'storyId',
        'createdAt',
        'createdBy',
        'createdByName'
      ]
    })
  }
```

ReSolve provides a unified API to manage data in storage (this code works with any supported storage type). **Read Model Adapters** provide the internal logic a Read Model uses to communicate with DBMSs.

We recommend that you store Read Model data in a denormalized form so that your Read Models are optimized for query performance.

## Updating a Read Model via Projection Functions

A projection function is used to accumulate the event data in a **Read Model storage**. Each projection function receives the storage object and event information. The event information includes the aggregateID, timestamp, and payload.

You can use the [standard API](api-reference#read-model-store-interface) to communicate with the store. The code sample below demonstrates a Read Model projection function's implementation:

```js
[STORY_COMMENTED]: async (
  store, { aggregateId, timestamp, payload: { parentId, userId, userName, commentId, text } }
) => {
  const comment = { id: commentId, text, parentId, comments: [], storyId: aggregateId,
    createdAt: timestamp, createdBy: userId, createdByName: userName }

  await store.insert('Comments', comment)
  await store.update(
    'Stories',
    { id: aggregateId },
    { $inc: { commentCount: 1 } }
  )
}
...
```

A [resolver](#resolvers) then uses the data from the store to prepare final data samples for data requests.

Note that you can add additional logic to a projection function. For instance, you can perform SQL queries, update Elastic Search indexes, write arbitrary data to files, etc.

If you delete the Read Model storage, the framework re-populates the store based on all the events. This can be useful in the development environment and when you deploy an updated version of the application.

## Resolvers

A **resolver** is the part of a Read Model that handles data requests. A resolver function receives the store and request parameters. Based on the parameters, the resolver function pulls data from the store and processes it to prepare the response object.

The code sample below demonstrates a Read Model implementation:

```js
comments: async (store, { first, offset }) => {
  const skip = first || 0
  const comments = await store.find(
    'Comments',
    {},
    null,
    { createdAt: -1 },
    skip,
    skip + offset
  )
  return Array.isArray(comments) ? comments : []
}
```

Refer to the [Query a Read Model](#query-a-read-model) section for information on how to send a request to a Read Model resolver.

## View Model Specifics

**View Models** are a special kind of Read Models. They are queried based on aggregate ID and and can automatically provide updates to Redux state on the client. View Models are defined in a special isomorphic format so their code can also be used on the client side to provide reducer logic.

Use View Models in the following scenarios:

- To create aggregate-centric views. Such views request relatively small portions of data based on aggregate IDs.
- To create reactive components, whose state is kept up-to date on the client.

A View Model's projection function receives a state and an event object, and returns an updated state. A projection function runs for every event with the specified aggregate ID from the beginning of the history on every request so it is important to keep View Models small. You can also store snapshots of the View Model state to optimize system resource consumption.

The code sample below demonstrates a View Model projection function:

<!-- prettier-ignore-start -->

[embedmd]:# (../examples/shopping-list/common/view-models/shopping_list.projection.js /^[[:blank:]]+\[SHOPPING_ITEM_CREATED/ /\}\),/)
```js
  [SHOPPING_ITEM_CREATED]: (state, { payload: { id, text } }) => ({
    ...state,
    list: [
      ...state.list,
      {
        id,
        text,
        checked: false
      }
    ]
  }),
```

<!-- prettier-ignore-end -->

Refer to the [Query a View Model](#query-a-view-model) section, for information on how to query a View Model.

Note that a View Model does not use the Read Model store.

## Performing Queries Using HTTP API

### Query a Read Model

To query a Read Model from the client side, send a POST request to the following URL:

```
http://{host}:{port}/api/query/{readModel}/{resolver}
```

##### URL Parameters:

| Name          | Description                                                                                                                           |
| ------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| **readModel** | The Read Model name as defined in [config.app.js](https://github.com/reimagined/resolve/blob/master/examples/with-saga/config.app.js) |
| **resolver**  | The name of a [resolver defined in the Read Model](#resolvers)                                                                        |

The request body should have the `application/json` content type and the following structure:

```js
{
  param1: value1,
  param2: value2,
  // ...
  paramN: valueN
}
```

The object contains the parameters that the resolver accepts.

##### Example

Use the following command to get 3 users from the [with-saga](https://github.com/reimagined/resolve/tree/master/examples/with-saga) example.

```sh
curl -X POST \
-H "Content-Type: application/json" \
-d "{\"page\":0, \"limit\":3}" \
"http://localhost:3000/api/query/default/users"
```

### Query a View Model

To query a View Model from the client side, send a GET request to the following URL:

```
http://{host}:{port}/api/query/{viewModel}/{aggregateIds}
```

##### URL Parameters

| Name         | Description                                                                                                                               |
| ------------ | ----------------------------------------------------------------------------------------------------------------------------------------- |
| viewModel    | The View Model name as defined in [config.app.js](https://github.com/reimagined/resolve/blob/master/examples/shopping-list/config.app.js) |
| aggregateIds | The comma-separated list of Aggregate IDs to include in the View Model. Use `*` to include all Aggregates                                 |

##### Example

Use the following command to get the current [shopping-list](https://github.com/reimagined/resolve/tree/master/examples/shopping-list) example application's state.

```sh
curl -g -X GET "http://localhost:3000/api/query/Default/shoppingLists"
```
