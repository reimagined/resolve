---
id: read-model-projection
title: Read Model Projection
description: Projection functions build a Read Models state based on incoming events.
---

A read model projection function has the following structure:

```js
async (store, event, context) => {
  ...
}
```

A projection implementation receives the following arguments:

| Argument Name | Description                                                                                           |
| ------------- | ----------------------------------------------------------------------------------------------------- |
| store         | Exposes [API](read-model-store.md) used to communicate with the read model's persistent data storage. |
| event         | An object that contains the incoming event's data.                                                    |
| context       | An object that contains data and functions related to the current operation.                          |

## context

The `context` argument is an object with the following fields:

| Field Name | Description                                                                |
| ---------- | -------------------------------------------------------------------------- |
| encrypt    | The user-defined [encrypt](../advanced-techniques.md#encryption) function. |
| decrypt    | The user-defined [decrypt](../advanced-techniques.md#encryption) function. |

This object can also contain additional fields added by [middleware](middleware.md)
