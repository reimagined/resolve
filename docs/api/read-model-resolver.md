---
id: read-model-resolver
title: Read Model Resolver
description:
---

A read model resolver function has the following signature:

```js
async (store, params, context) => {
  ...
  return resultingData
}
```

### context

the `context` argument is an object with the following fields:

| Field Name     | Description                                                                     |
| -------------- | ------------------------------------------------------------------------------- |
| jwt            | The JSON Web Token attached to the request.                                     |
| secretsManager | The application's [secrets manager](../advanced-techniques.md#storing-secrets). |
