---
id: typescript-support
title: TypeScript Support
---

```mdx-code-block
import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';
```

## Overview

ReSolve is written in TypeScript and its packages export type declarations for all building blocks of a reSolve application.
This article describes how to develop a reSolve application with TypeScript and lists types that you need to use in the application code.

## Creating a TypeScript Application

All [template and example projects](introduction.md#examples-and-template-projects) are available both in JavaScript and TypeScript variations. When you use the `create-resolve-app` tool, add the `-t` flag to the command input to specify that a TypeScript application should be created:

```sh
yarn create resolve-app hello-world-react -e react -t
```

## Developing With reSolve Types

When you develop a reSolve application with TypeScript, you need to assign correct types to all of the application's building blocks ([aggregates](write-side.md), [read model projections and resolvers](read-side.md), [sagas](sagas.md), and so on). Refer to the resources listed below for information on the type scheme that you should follow:

- The [Type Correspondence Tables](#type-correspondence-tables) list the available types in a single document section.
- All TypeScript [example](https://github.com/reimagined/resolve/tree/master/examples) and [template](https://github.com/reimagined/resolve/tree/dev/templates) projects are correctly typed and can be used for reference.
- The API Reference articles contain information on the types associated with the described API members.

### Example

The code below demonstrates a correctly typed read model implementation:

<Tabs>
<TabItem value="projection" label="Projection" default>

```js
import { ReadModel } from '@resolve-js/core'
import { ResolveStore } from '@resolve-js/readmodel-base'
...

const projection: ReadModel<ResolveStore> = {
  Init: async (store) => {
    await store.defineTable('ShoppingLists', {
      indexes: {
        id: 'string',
      },
      fields: ['createdAt', 'name'],
    })
  },

  [SHOPPING_LIST_CREATED]: async (
    store,
    { aggregateId, timestamp, payload: { name } }
  ) => {
    const shoppingList = {
      id: aggregateId,
      name,
      createdAt: timestamp,
    }

    await store.insert('ShoppingLists', shoppingList)
  },
  ...
}
export default projection
```

</TabItem>
<TabItem value="resolvers" label="Resolvers">

```js
import { ReadModelResolvers } from '@resolve-js/core'
import { ResolveStore } from '@resolve-js/readmodel-base'

const resolvers: ReadModelResolvers<ResolveStore> = {
  all: async (store) => {
    return await store.find('ShoppingLists', {}, null, { createdAt: 1 })
  },
}

export default resolvers
```

</TabItem>
</Tabs>

For more information on the types used in the above code sample, refer to the following API reference articles:

- [`ReadModel`](api/read-model/projection.md)
- [`ReadModelResolvers`](api/read-model/resolver.md)
- [`ResolveStore`](api/read-model/store.md)

## Type Correspondence Tables

The tables below list the available TypeScript types and the packages that export these types.

### Write Side

| Object                                                         | Type                  | Package            |
| -------------------------------------------------------------- | --------------------- | ------------------ |
| [Aggregate Command Handlers](api/aggregate/command-handler.md) | `Aggregate`           | `@resolve-js/core` |
| [Aggregate Projection](api/aggregate/projection.md)            | `AggregateProjection` | `@resolve-js/core` |
| [Command](api/command.md)                                      | `Command`             | `@resolve-js/core` |
| [Event](api/event.md)                                          | `Event`               | `@resolve-js/core` |

### Read Side

#### Read Models

| Object                                               | Type                   | Package                      |
| ---------------------------------------------------- | ---------------------- | ---------------------------- |
| [Projection](api/read-model/projection.md)           | `ReadModel`            | `@resolve-js/core`           |
| [Resolvers](api/read-model/resolver.md)              | `ReadModelResolvers`   | `@resolve-js/core`           |
| [Resolver](api/read-model/resolver.md)               | `ReadModelResolver`    | `@resolve-js/core`           |
| [Store](api/read-model/store.md)                     | `ResolveStore`         | `@resolve-js/readmodel-base` |
| [Query](api/read-model/query.md#query-object)        | `ReadModelQuery`       | `@resolve-js/core`           |
| [Query Result](api/read-model/query.md#query-result) | `ReadModelQueryResult` | `@resolve-js/core`           |

#### View Models

| Object                                                | Type                   | Package            |
| ----------------------------------------------------- | ---------------------- | ------------------ |
| [View Model Projection](api/view-model/projection.md) | `ViewModelProjection`  | `@resolve-js/core` |
| [Read Model Resolvers](api/view-model//resolver.md)   | `ViewModelResolver`    | `@resolve-js/core` |
| [Query](api/view-model//query.md#query-object)        | `ViewModelQuery`       | `@resolve-js/core` |
| [Query Result](api/view-model/query.md#result-object) | `ViewModelQueryResult` | `@resolve-js/core` |

#### Saga

| Object              | Type   | Package            |
| ------------------- | ------ | ------------------ |
| [Saga](api/saga.md) | `Saga` | `@resolve-js/core` |

### Middleware

| Object                                                                                 | Type                            | Package            |
| -------------------------------------------------------------------------------------- | ------------------------------- | ------------------ |
| [Command Middleware](api/middleware.md#command-middleware)                             | `CommandMiddleware`             | `@resolve-js/core` |
| [Read Model Projection Middleware](api/middleware.md#read-model-projection-middleware) | `ReadModelProjectionMiddleware` | `@resolve-js/core` |
| [Read Model Resolver Middleware](api/middleware.md#read-model-projection-middleware)   | `ReadModelResolverMiddleware`   | `@resolve-js/core` |

### API Handlers

| Block Name                                          | Type                 | Package                    |
| --------------------------------------------------- | -------------------- | -------------------------- |
| [Request](api/api-handler/api-handler.md#request)   | `ResolveRequest`     | `@resolve-js/runtime-base` |
| [Response](api/api-handler/api-handler.md#response) | `ResolveResponse`    | `@resolve-js/runtime-base` |
| [Context](api/api-handler/resolve-context.md)       | `UserBackendResolve` | `@resolve-js/runtime-base` |

### Monitoring

| Block Name                                                     | Type                     | Package            |
| -------------------------------------------------------------- | ------------------------ | ------------------ |
| [Metric](api/monitoring/metric.md#metric-object)               | `MonitoringMetric`       | `@resolve-js/core` |
| [Custom Metric](api/monitoring/metric.md#custom-metric-object) | `MonitoringCustomMetric` | `@resolve-js/core` |
| [Adapter](api/monitoring/monitoring-adapter.md)                | `MonitoringAdapter`      | `@resolve-js/core` |
| [Monitoring Object](api/monitoring/monitoring.md)              | `Monitoring`             | `@resolve-js/core` |
