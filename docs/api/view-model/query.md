---
id: query
title: Query
---

## Query Object

A view model query object has the following structure:

<!-- prettier-ignore-start -->

```js
{
  modelName, // (string) The name of a view model.
  aggregateIds, // (string[] or '*') A list of aggregate IDs for which to process events.
}
```

<!-- prettier-ignore-end -->

## Result Object

A view model query result is a serializable value, whose type and internal structure depend on the [view model projection](projection.md)'s implementation.
