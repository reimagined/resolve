---
id: query
title: Query
---

## Query Object

:::info TypeScript Support

A view model query has an associated TypeScript type:

- Type Name - `ViewModelQuery`
- Package - `@resolve-js/core`

:::

A view model query object has the following structure:

<!-- prettier-ignore-start -->

```js
{
  modelName, // (string) The name of the view model.
  aggregateIds, // (string[] or '*') A list of aggregate IDs for which to process events.
  aggregateArgs, // (object) An object that contains arguments attached to the query.
}
```

<!-- prettier-ignore-end -->

## Result Object

:::info TypeScript Support

A view model query result has an associated TypeScript type:

- Type Name - `ViewModelQueryResult`
- Package - `@resolve-js/core`

:::

A view model query result is a serializable value, whose type and internal structure depend on the [view model projection](projection.md)'s implementation.
