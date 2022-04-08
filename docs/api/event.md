---
id: event
title: Event
---

:::info TypeScript Support

An event object has an associated TypeScript type:

- Type Name - `Event`
- Package - `@resolve-js/core`

:::

An event is an object of the following structure:

<!-- prettier-ignore-start -->

```js
{
  type, // A string that contains the command type name.
  timestamp, // A number type field that stores the point in time when the event was produced. 
  aggregateId, // A string that uniquely identifies an aggregate instance.
  aggregateVersion, // A number that is incremented for each subsequent event with the current aggregateId. 
  payload // Optional. An object of arbitrary structure that contains data attached to the event.
}
```

<!-- prettier-ignore-end -->
