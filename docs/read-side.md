---
id: read-side
title: Read Side
---

## Read Models

The reSolve framework's read side listens to events that the write side produces. Based on the events, the read side updates **Read Models**. The Read Models then provide data to answer queries.

A Read Model is defined by a set of projection functions and query resolver functions.

- **[Projection functions](#updating-a-read-model-via-projection-functions)** build a Read Models state based on incoming events.
- **[Query resolvers](#resolvers)** use data from the accumulated state to answer queries.

ReSolve also provides a special kind of Read Models that can be calculated on the fly, sent to the client and kept there up-to-date. Such Read Models are called **View Models**. Refer to the [View Model Specifics](view-model-specifics) section for more information.

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
      adapterName: 'default'
    }
  ],
  ...
}
```

In the configuration object, specify the Read Model's name and the paths to the files containing projections and resolvers. Here, you can also specify the Read Model's storage adapter.

You can define the available adapters in the **readModelAdapters** section:

```js
const devConfig = {
  ...
  readModelAdapters: [
    {
      name: 'default',
      module: 'resolve-readmodel-memory',
      options: {}
    }
  ],
}
```

```js
import { declareRuntimeEnv } from 'resolve-scripts'
const prodConfig = {
  ...
  readModelAdapters: [
    {
      name: 'default',
      module: 'resolve-readmodel-mysql',
      options: {
        host: declareRuntimeEnv('SQL_HOST'),
        database: declareRuntimeEnv('SQL_DATABASE'),
        user: declareRuntimeEnv('SQL_USER'),
        password: declareRuntimeEnv('SQL_PASSWORD'),
      }
    }
  ],
}
```

### Configuring View Models

In the same way, you should register your View Models in the **viewModels** section:

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
          pathToFile: 'snapshot.db',
        }
      }
    }
  ],
  ...
}
```

In the configuration object, specify the View Model's name and the path to the file containing projection definition. You can also specify the View Model snapshot storage adapter. Use the **serializeState** and **deserializeState** options to specify paths to a View Model's serializer and deserializer functions.

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
    ...
  },
```

ReSolve provides a unified API to manage data in a storage, so this code will work with any supported storage type. The internal logic used to communicate with various DBMSs is provided by **Read Model Adapters**.

Do not hesitate to store Read Model data in a denormalized form so that your Read Models are optimized for query speed.

## Updating a Read Model via Projection Functions

A projection function is used to accumulate the event data in a **Read Model storage**. Each projection function takes the storage object and event information. The event information includes the aggregateID, timestamp and payload.

You can communicate with the store using the standard API. The code sample below demonstrates a typical Read Model projection function implementation:

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

A [resolver](#resolvers) then uses the data from the store to prepare final data samples in response to data requests.

If you delete the Read Model storage, this will force the framework to re-populate the store based on all events from the beginning of the history. This can be useful in the development environment and when you deploy an updated version of the application.

Note that reSolve does not limit you on what logic you can use in a projection function implementation as long as it helps you prepare data required to answer queries. Depending on your requirements, you can perform SQL queries, update Elastic Search indexes, write arbitrary data to files, etc.

## Resolvers

A **resolver** is the part of a Read Model that handles data requests. A resolver function receives the store and request parameters. Based on the parameters, the resolver function pulls the required data from the store and processes it to prepare the response object.

The code sample below demonstrate a typical Read Model implementation:

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

Refer to the [Query a Read Model](#query-a-read-model) section to learn how to send a request to a Read Model resolver.

## View Model Specifics

**View Models** are a special kind of Read Models. They are queried based on aggregate ID and and can automatically provide updates to Redux state on the client. View Models are defined in a special isomorphic format so their code can also be used on the client side to provide reducer logic.

Use View Models in the following scenarios:

- To create aggregate-centric views. Such views request relatively small portions of data based on aggregate IDs.
- To create reactive components, whose state is kept up-to date on the client.

A View Model's projection function receives a state and an event object, and returns an updated state. A projection function runs for every event with the specified aggregate ID from the beginning of the history on every request so it is important to keep View Models small. You can also store snapshots of the View Model state to optimize system resource consumption.

The code sample below demonstrate a typical View Model projection function:

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

Refer to the [Query a View Model](#query-a-view-model) section, to learn how to query a View Model.

Note that a View Model does not use the Read Model store.

## Performing Queries Using HTTP API

### Query a Read Model

You can query a Read Model from the client side by sending a POST request to the following URL:

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

You can query a View Model from the client side by sending a POST request to the following URL:

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
