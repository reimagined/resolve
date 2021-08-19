---
id: command-handler
title: Command Handler
description:
---

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

| Argument Name | Description                                                                                           |
| ------------- | ----------------------------------------------------------------------------------------------------- |
| state         | The state object built by the aggregate [projection](../write-side.md#aggregate-projection-function). |
| command       | An object that contains the incoming command's data.                                                  |
| context       | An object that contains data and functions related to the current operation.                          |

## context

The `context` argument is an object with the following fields:

| Field Name       | Description                                                                |
| ---------------- | -------------------------------------------------------------------------- |
| jwt              | The JSON Web Token attached to the request.                                |
| aggregateVersion | The aggregate version identifier.                                          |
| encrypt          | The user-defined [encrypt](../advanced-techniques.md#encryption) function. |
| decrypt          | The user-defined [decrypt](../advanced-techniques.md#encryption) function. |

This object can also contain additional fields added by [middleware](middleware.md)
