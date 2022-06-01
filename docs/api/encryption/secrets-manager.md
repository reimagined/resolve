---
id: secrets-manager
title: Secrets Manager
---

A Secrets Manager object exposes API used to save and load cryptographic secrets to/from the event store database. An [encryption factory function](factory-function.md) can access this object through it's `context` parameter:

```js
// common/aggregates/encryption.js
import { generate } from 'generate-password'

const createEncryption = (aggregateId, context) => {
  const { secretsManager } = context
  let aggregateKey = await secretsManager.getSecret(aggregateId)
  if (!aggregateKey) {
    aggregateKey = generate({
      length: 20,
      numbers: true,
    })
    await secretsManager.setSecret(aggregateId, aggregateKey)
  }
  ...
}
```

The `secretsManager` object contains the following functions:

| Function Name                   | Description                                                                                                                                 |
| ------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| [`getSecret`](#getsecret)       | Takes a unique ID as an argument and returns a promise that resolves to a string if a secret was found or `null` if a secret was not found. |
| [`setSecret`](#setsecret)       | Takes a unique ID and a secret string as arguments and returns a promise that resolves if the secret was successfully saved.                |
| [`deleteSecret`](#deletesecret) | Takes a unique ID as an argument and returns a promise that resolves if the secret was successfully deleted.                                |

:::caution
The unique ID of an existing or deleted secret cannot be reused. If you pass a previously used ID to the [`setSecret`](#setsecret) function, an exception is raised.
:::

## `getSecret`

Get a stored secret from the event store.

**Example**

<!-- prettier-ignore-start -->

[mdis]:# (../../../tests/eventstore-secrets/index.test.ts#get-secret)
```js
const secret = await secretManager.getSecret(id)
```
<!-- prettier-ignore-end -->

**Arguments**

| Argument Name | Type     | Description                                            |
| ------------- | -------- | ------------------------------------------------------ |
| `id`          | `string` | The secret's unique identifier within the event store. |

**Result**

A promise that resolves to either the loaded secret or `null` if the secret with the specified `id` was not found.

## `setSecret`

Saves the specified secret to the event store.

**Example**

<!-- prettier-ignore-start -->

[mdis]:# (../../../tests/eventstore-secrets/index.test.ts#set-secret)
```js
await secretManager.setSecret(id, secret)
```
<!-- prettier-ignore-end -->

**Arguments**

| Argument Name | Type     | Description                                            |
| ------------- | -------- | ------------------------------------------------------ |
| `id`          | `string` | The secret's unique identifier within the event store. |
| `secret`      | `string` | The secret to save.                                    |

**Result**

A `promise` that resolves when the secret has been successfully saved to the event store.

## `deleteSecret`

Deletes a secret from the event store.

**Example**

<!-- prettier-ignore-start -->

[mdis]:# (../../../tests/eventstore-secrets/index.test.ts#delete-secret)
```js
const isDeleted = await secretManager.deleteSecret(id)
```
<!-- prettier-ignore-end -->

**Arguments**

| Argument Name | Type     | Description                                            |
| ------------- | -------- | ------------------------------------------------------ |
| `id`          | `string` | The secret's unique identifier within the event store. |

**Result**

A promise that resolves to a `boolean` value. The value indicates whether or not a secret with the specified `id` has been found and successfully deleted.

## See Also

- [Encryption](../../encryption.md)
- [Encryption Factory Function](factory-function.md)
