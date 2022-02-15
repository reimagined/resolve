---
id: typescript-support
title: TypeScript Support
---

```mdx-code-block
import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';
```

## Overview

ReSolve is written TypeScript and provides type definitions for most of the framework's functional blocks.
This article describes various aspects of using TypeScript when developing a reSolve application.

## Creating a TypeScript Application

All [template and example projects](introduction.md#examples-and-template-projects) shipped with reSolve come in a TypeScript flavor. When using the `create-resolve-app` tool, add the `-t` flag to the input to specify that a TypeScript application should be created:

```sh
yarn create resolve-app hello-world-react -e react -t
```

## Developing With reSolve Types

You can refer the API reference and the [example projects](introduction.md#examples-and-template-projects) provided with reSolve for the information on the type scheme that you should follow when implementing various building block of a reSolve application.

In general, most of the blocks require one ore more type imports from a containing package. For example the code below demonstrates a correctly typed read model implementation:

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

For more information on the used types and their definitions, refer to the API reference:

- [`ReadModel`](api/read-model/projection.md)
- [`ReadModelResolvers`](api/read-model/resolver.md)
- [`ResolveStore`](api/read-model/store.md)

## Type Correspondence Table

You can use the table below as a quick reference for the provided TypeScript types and the packages where they reside.

### Aggregates

| Block Name                 | TypeScript Type Name  | Package            |
| -------------------------- | --------------------- | ------------------ |
| Aggregate Command Handlers | `Aggregate`           | `@resolve-js/core` |
| Aggregate Projection       | `AggregateProjection` | `@resolve-js/core` |
| Command                    | `Command`             | `@resolve-js/core` |

### Read Models

| Block Name            | TypeScript Type Name | Package                      |
| --------------------- | -------------------- | ---------------------------- |
| Read Model Projection | `ReadModel`          | `@resolve-js/core`           |
| Read Model Resolvers  | `ReadModelResolvers` | `@resolve-js/core`           |
| A Read Model Resolver | `ReadModelResolver`  | `@resolve-js/core`           |
| Read Model Store      | `ResolveStore`       | `@resolve-js/readmodel-base` |

### View Models

| Block Name            | TypeScript Type Name  | Package            |
| --------------------- | --------------------- | ------------------ |
| View Model Projection | `ViewModelProjection` | `@resolve-js/core` |
| Read Model Resolvers  | `ViewModelResolver`   | `@resolve-js/core` |
