---
id: read-side
title: Read Side
description: The reSolve framework's read side listens to events that the write side produces. Based on these events, the read side updates the read models that supply data to the queries.
---

## Read Models

The reSolve framework's read side listens to events that the write side produces. Based on these events, the read side updates the **Read Models**, and these models supply data to the queries.

A Read Model is defined by a set of projection functions and query resolver functions.

- **[Projection functions](#updating-a-read-model-with-projection-functions)** build a Read Model's state based on incoming events.
- **[Query resolvers](#resolvers)** use data from the accumulated state to answer queries.

ReSolve also supports **View Models**. A View Model is a Read Model that is built on the fly. A View Model can maintain a WebSocket connection to push data updates to the client. Refer to the [View Model Specifics](#view-model-specifics) section for more information.

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

**config.dev.js:**

```js
const devConfig = {
  ...
  readModelConnectors: {
    default: {
      module: '@resolve-js/readmodel-lite',
      options: {}
    }
  },
}
```

**config.cloud.js:**

```js
import { declareRuntimeEnv } from '@resolve-js/scripts'
const prodConfig = {
  ...
  readModelConnectors: {
    default: {
      module: '@resolve-js/readmodel-postgresql',
      options: {
        databaseName: declareRuntimeEnv('RESOLVE_READMODEL_DATABASE_NAME'),
        host: declareRuntimeEnv('RESOLVE_READMODEL_CLUSTER_HOST'),
        port: declareRuntimeEnv('RESOLVE_READMODEL_CLUSTER_PORT'),
        user: declareRuntimeEnv('RESOLVE_USER_ID'),
        password: declareRuntimeEnv('RESOLVE_USER_PASSWORD'),
        database: 'postgres',
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
      resolver: 'common/view-models/story-details.validator.js'
    }
  ]
}
```

In the configuration object, specify the View Model's name and the path to the file containing projection definition. Use the **serializeState** and **deserializeState** options to specify paths to a View Model's serializer and deserializer functions. Specify the **resolver** option to add a [View Model resolver](#view-model-resolver) to the View Model.

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

ReSolve exposes a unified API to manage data in storage (this code works with any supported storage type). **Read Model Adapters** implement the internal logic a Read Model uses to communicate with DBMSs.

We recommend that you store Read Model data in a denormalized form so that your Read Models are optimized for query performance.

## Updating a Read Model with Projection Functions

A projection function is used to accumulate the event data in a **Read Model storage**. Each projection function receives the storage object and event information. The event information includes the aggregateID, timestamp, and payload.

You can use the [standard API](api/read-model/store.md) to communicate with the store. The code sample below demonstrates a Read Model projection function's implementation:

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

> A Read Model's projection should only use tables that were created in this Read Model's `Init` handler. If you try to access tables created in other Read Models, a “Table does not exist” error is generated.

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

**View Models** are ephemeral Read Models that are queried based on aggregate ID. They have the following properties:

- View Models are rebuilt on every request. They do not store persistent state and do not use the Read Model store.
- View Models are queried based on aggregate ID and can maintain a WebSocket connection to push data updates to the client.
- View Model projections are defined in a format that is isomorphic with Redux reducers so their code can also be used on the client side to define reducer logic.

Use View Models in the following scenarios:

- To create aggregate-centric views that request relatively small portions of data based on aggregate IDs.
- To create reactive components, whose state is kept up-to-date on the client.

A View Model's projection function receives a state and an event object, and returns an updated state. A projection function runs for every event with the specified aggregate ID from the beginning of the history on every request so it is important to keep View Models small. You can also store snapshots of the View Model state to optimize system resource consumption.

The code sample below demonstrates a View Model projection function:

<!-- prettier-ignore-start -->

[embedmd]:# (../examples/js/shopping-list/common/view-models/shopping_list.projection.js /^[[:blank:]]+\[SHOPPING_ITEM_CREATED/ /\}\),/)
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

## View Model Resolver

A View Model's **resolver** allows you to restrict a user's access to the View Model's data. A resolver function receives the following parameters:

- The reSolve context object;
- The query object that contains a list of aggregate IDs;
- An object that contains a JSON Web Token and View Model settings. The View Model settings object contains the View Model's name and a list of available event types.

In the resolver's code, you can use arbitrary logic to check a user's access permissions and either throw an exception to indicate an access error or filter the `eventTypes` list to specify what events are available to the user.

The resolver function should return a built View Model data object and a meta object that contains the following data:

- The data cursor used to traverse the events included into the query result set. The initial cursor is returned by the `buildViewModel` function;
- A list of event types available to the client;
- A list of aggregate IDs available to the client.

The code sample below demonstrates a View Model resolver implementation:

```js
// common/view-models/story-details.validator.js
import jwt from 'jsonwebtoken'
import jwtSecret from '../../auth/jwt-secret'

export default async (resolve, query, { jwt: token, viewModel }) => {
  try {
    jwt.verify(token, jwtSecret)
  } catch (error) {
    throw new Error('Permission denied')
  }

  const { data, cursor } = await resolve.buildViewModel(viewModel.name, query)

  return {
    data,
    meta: {
      cursor,
      eventTypes: viewModel.eventTypes,
      aggregateIds: query.aggregateIds,
    },
  }
}
```

Use a View Model's `resolver` configuration option to register a resolver:

```js
// config.app.js
const appConfig = {
  ...
  viewModels: [
    {
      name: 'storyDetails',
      ...
      resolver: 'common/view-models/story-details.validator.js'
    }
  ]
}
```

See the [Configuring View Models](#configuring-view-models) section for more information.

## Performing Queries

To send queries to an application's read side, you can use the reSolve [HTTP API](api/client/http-api.md) or one of the available [client libraries](frontend.md).

### Example

The code sample below demonstrates how to use the [@resolve-js/client](api/client/resolve-client.md) library to query a View Model:

```js
const queryResult = await client.query({
  name: 'chat',
  aggregateIds: [chatRoom],
  args: undefined,
})
const {
  data,
  meta: { url, cursor },
} = queryResult
```
