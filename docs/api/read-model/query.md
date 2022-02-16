---
id: query
title: Query
---

## Query Object

:::info TypeScript Support

A read model query has an associated TypeScript type:

- Type Name - `ReadModelQuery`
- Containing Package - `@resolve-js/core`

:::

A read model query object has the following structure:

<!-- prettier-ignore-start -->

```js
{
  modelName, // (string) The name of a read model.
  resolverName, // (string) The name of a read model resolver.
  resolverArgs, // (object) Specifies resolver arguments as key-value pairs.
  jwt, // (string, optional) A JSON Web Token used to authorize the query.
}
```

<!-- prettier-ignore-end -->

## Result Object

:::info TypeScript Support

A read model query result has an associated TypeScript type:

- Type Name - `ReadModelQueryResult`
- Containing Package - `@resolve-js/core`

:::

A read model query result can be a value of any serializable type depending on the implementation of the queried read model resolver:

```js title="common/read-models/shopping-lists.resolvers.js"
const resolvers = {
  all: async (store) => {
    return await store.find('ShoppingLists', {}, null, { createdAt: 1 })
  },
}
export default resolvers
```
