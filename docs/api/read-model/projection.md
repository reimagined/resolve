---
id: projection
title: Projection
---

A read model event handler function has the following structure:

```js
async (store, event, context) => {
  ...
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
