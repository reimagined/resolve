---
id: resolver
title: Resolver
description: A resolver is the part of a Read Model that handles data requests.
---

A read model resolver function has the following structure:

```js
async (store, params, context) => {
  ...
  return resultingData
}
```

A resolver implementation receives the following arguments:

| Argument Name | Description                                                                                              |
| ------------- | -------------------------------------------------------------------------------------------------------- |
| store         | Exposes [API](../read-model/store.md) used to communicate with the read model's persistent data storage. |
| params        | An object that contains the request parameters as key-value pairs.                                       |
| context       | An object that contains data and functions related to the current operation.                             |

## context

The `context` argument is an object with the following fields:

| Field Name     | Description                                                               |
| -------------- | ------------------------------------------------------------------------- |
| jwt            | The JSON Web Token attached to the request.                               |
| secretsManager | The application's [secrets manager](../../encryption.md#storing-secrets). |

This object can also contain additional fields added by [middleware](../../middleware.md).
