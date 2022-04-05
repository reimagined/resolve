---
id: projection
title: Projection
---

:::info TypeScript Support

A read model projection has an associated TypeScript type:

- Type Name - `ReadModel`
- Package - `@resolve-js/core`

:::

A read model projection is an object of the following structure:

```js
const projection = {
  // The *Init* function initializes the read model's persistent store.
  Init: async (store) => { ... }
  // An event handler function is associated with an event type.
  // It receives the read model store and an incoming event
  // and updates the store based on the event's data.
  [EVENT_TYPE1]: async (store, event, context) -> { ... }
  [EVENT_TYPE2]: async (store, event, context) -> { ... }
}
```

An event handler implementation receives the following arguments:

| Argument Name | Description                                                                                              |
| ------------- | -------------------------------------------------------------------------------------------------------- |
| store         | Exposes [API](../read-model/store.md) used to communicate with the read model's persistent data storage. |
| event         | An object that contains the incoming event's data.                                                       |
| context       | An object that contains data and functions related to the current operation.                             |

## context

The `context` argument is an object with the following fields:

| Field Name | Description                                               |
| ---------- | --------------------------------------------------------- |
| encrypt    | The user-defined [encrypt](../../encryption.md) function. |
| decrypt    | The user-defined [decrypt](../../encryption.md) function. |

This object can also contain additional fields added by [middleware](../../middleware.md).
