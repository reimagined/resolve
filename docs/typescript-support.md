---
id: typescript-support
title: TypeScript Support
---

```mdx-code-block
import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';
```

## Overview

ReSolve is written in TypeScript and its packages export type definitions for most of the framework's functional blocks.
This article describes how to develop a reSolve application with TypeScript and lists types that you need to use in the application code.

## Creating a TypeScript Application

All [template and example projects](introduction.md#examples-and-template-projects) are available in a JavaScript and TypeScript variations. When you use the `create-resolve-app` tool, add the `-t` flag to the input to specify that a TypeScript application should be created:

```sh
yarn create resolve-app hello-world-react -e react -t
```

## Developing With reSolve Types

You can refer the API reference and the [example projects](introduction.md#examples-and-template-projects) for the information on the type scheme that you should follow when implementing various building block of a reSolve application.

In general, most of the blocks require one ore more type imports from a reSolve packages. For example the code below demonstrates a correctly typed read model implementation:

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

For more information on the used types used in the above code sample, refer to the following API reference articles:

- [`ReadModel`](api/read-model/projection.md)
- [`ReadModelResolvers`](api/read-model/resolver.md)
- [`ResolveStore`](api/read-model/store.md)

## Type Correspondence Table

The tables below list the available TypeScript types and the packages that export these types.

### Write Side

| Object                     | Type                  | Package            |
| -------------------------- | --------------------- | ------------------ |
| Aggregate Command Handlers | `Aggregate`           | `@resolve-js/core` |
| Aggregate Projection       | `AggregateProjection` | `@resolve-js/core` |
| Command                    | `Command`             | `@resolve-js/core` |
| Event                      | `Event`               | `@resolve-js/core` |

### Read Side

#### Read Models

| Object       | Type                   | Package                      |
| ------------ | ---------------------- | ---------------------------- |
| Projection   | `ReadModel`            | `@resolve-js/core`           |
| Resolvers    | `ReadModelResolvers`   | `@resolve-js/core`           |
| Resolver     | `ReadModelResolver`    | `@resolve-js/core`           |
| Store        | `ResolveStore`         | `@resolve-js/readmodel-base` |
| Query        | `ReadModelQuery`       | `@resolve-js/core`           |
| Query Result | `ReadModelQueryResult` | `@resolve-js/core`           |

#### View Models

| Object                | Type                   | Package            |
| --------------------- | ---------------------- | ------------------ |
| View Model Projection | `ViewModelProjection`  | `@resolve-js/core` |
| Read Model Resolvers  | `ViewModelResolver`    | `@resolve-js/core` |
| Query                 | `ViewModelQuery`       | `@resolve-js/core` |
| Query Result          | `ViewModelQueryResult` | `@resolve-js/core` |

#### Saga

| Object | Type   | Package            |
| ------ | ------ | ------------------ |
| Saga   | `Saga` | `@resolve-js/core` |

### Middleware

| Object                           | Type                            | Package            |
| -------------------------------- | ------------------------------- | ------------------ |
| Command Middleware               | `CommandMiddleware`             | `@resolve-js/core` |
| Read Model Projection Middleware | `ReadModelProjectionMiddleware` | `@resolve-js/core` |
| Read Model Resolver Middleware   | `ReadModelResolverMiddleware`   | `@resolve-js/core` |

### API Handlers

| Block Name | Type                 | Package                    |
| ---------- | -------------------- | -------------------------- |
| Request    | `ResolveRequest`     | `@resolve-js/runtime-base` |
| Response   | `ResolveResponse`    | `@resolve-js/runtime-base` |
| Context    | `UserBackendResolve` | `@resolve-js/runtime-base` |

### Monitoring

| Block Name        | Type                     | Package            |
| ----------------- | ------------------------ | ------------------ |
| Metric            | `MonitoringMetric`       | `@resolve-js/core` |
| Custom Metric     | `MonitoringCustomMetric` | `@resolve-js/core` |
| Adapter           | `MonitoringAdapter`      | `@resolve-js/core` |
| Monitoring Object | `Monitoring`             | `@resolve-js/core` |
