---
id: factory-function
title: Factory Function
---

# Encryption Factory Function

## Overview

To implement aggregate or read model encryption, you need to define an encryption factory function. This function receives data about the currently processed operation and returns an object that contains your implementation of an `encrypt` and `decrypt` functions.

## Aggregate Encryption

An aggregate encryption function has the following structure:

```js
// common/aggregates/encryption.js
const createEncryption = (aggregateId, context) => {
  ...
  // Returns an object that contains 'encrypt' and 'decrypt' functions
  return {
    encrypt: (data) => ..., // A function that takes data and returns its encrypted version
    decrypt: (blob) => ..., // A function that takes an encrypted blob and returns unencrypted data
  }
}
export default createEncryption
```

### Arguments

| Name          | Type                                                                    | Description                                             |
| ------------- | ----------------------------------------------------------------------- | ------------------------------------------------------- |
| `aggregateId` | `string`                                                                | The aggregate ID associated with the current operation. |
| `context`     | An [aggregate encryption context](#aggregate-encryption-context) object | Contains data and API related to the current operation. |

### Result

The returned value should be an object of the following structure:

```js
{
  encrypt: (data) => ..., // A function that takes data and returns its encrypted version
  decrypt: (blob) => ..., // A function that takes an encrypted blob and returns unencrypted data
}
```

## Read Model Encryption

A read model encryption function has the following structure:

```js
// common/read-models/encryption.js
const createEncryption = (event, context) => {
  ...
  // Returns an object that contains 'encrypt' and 'decrypt' functions
  return {
    encrypt: (data) => ..., // A function that takes data and returns its encrypted version
    decrypt: (blob) => ..., // A function that takes an encrypted blob and returns unencrypted data
  }
}
export default createEncryption
```

### Arguments

| Name      | Type                                                                            | Description                                             |
| --------- | ------------------------------------------------------------------------------- | ------------------------------------------------------- |
| `event`   | [event](../event.md)                                                            | The currently processed event.                          |
| `context` | An [event handler encryption context](#event-handler-encryption-context) object | Contains data and API related to the current operation. |

### Result

```js
{
  encrypt: (data) => ..., // A function that takes data and returns its encrypted version
  decrypt: (blob) => ..., // A function that takes an encrypted blob and returns unencrypted data
}
```

## Related Types

### Aggregate Encryption Context

The aggregate encryption context object has the following fields:

| Name             | Type                                           | Description                                                         |
| ---------------- | ---------------------------------------------- | ------------------------------------------------------------------- |
| `jwt?`           | `string`                                       | A JSON Web Token attached to the current request.                   |
| `secretsManager` | A [secrets manager](secrets-manager.md) object | Exposes API used to store cryptographic secrets in the event store. |

### Event Handler Encryption Context

The event handler encryption context object has the following fields:

| Name             | Type                                           | Description                                                         |
| ---------------- | ---------------------------------------------- | ------------------------------------------------------------------- |
| `secretsManager` | A [secrets manager](secrets-manager.md) object | Exposes API used to store cryptographic secrets in the event store. |
