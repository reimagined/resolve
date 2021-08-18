---
id: read-model-projection
title: Read Model Projection
description:
---

A read model projection function has the following signature:

```js
async (store, event, context) => {
  ...
}
```

### context

the `context` argument is an object with the following fields:

| Field Name | Description                                                                |
| ---------- | -------------------------------------------------------------------------- |
| encrypt    | The user-defined [encrypt](../advanced-techniques.md#encryption) function. |
| decrypt    | The user-defined [decrypt](../advanced-techniques.md#encryption) function. |
