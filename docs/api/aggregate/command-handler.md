---
id: command-handler
title: Command Handler
---

:::info TypeScript Support

A commands container object has an associated TypeScript type:

- Type Name - `Aggregate`
- Containing Package - `@resolve-js/core`

:::

A command handler function has the following structure:

```js
(state, command, context) => {
  ...
  return {
    type: 'CommandTypeName',
    payload: { ... },
  }
}
```

A command handler implementation receives the following arguments:

| Argument Name | Description                                                                                              |
| ------------- | -------------------------------------------------------------------------------------------------------- |
| state         | The state object built by the aggregate [projection](../../write-side.md#aggregate-projection-function). |
| command       | An object that contains the incoming command's data.                                                     |
| context       | An object that contains data and functions related to the current operation.                             |

## Context

The `context` argument is an object with the following fields:

| Field Name       | Description                                                                                                |
| ---------------- | ---------------------------------------------------------------------------------------------------------- |
| jwt              | The JSON Web Token attached to the request.                                                                |
| aggregateVersion | The aggregate version that is a number incremented for each consequent event with the current aggregateId. |
| encrypt          | The user-defined [encrypt](../../encryption.md) function.                                                  |
| decrypt          | The user-defined [decrypt](../../encryption.md) function.                                                  |

This object can also contain additional fields added by [middleware](../../middleware.md).
