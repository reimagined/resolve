---
id: secrets-manager
title: Secrets Manager
---

A Secrets Manager object exposes API used to save and load cryptographic secrets to/from the event store database. An encryption factory function can access this object through it's `context` parameter:

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

| Function Name  | Description                                                                                                                               |
| -------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| `getSecret`    | Takes a unique ID as an argument and returns a promise that resolves to a string if a secret was found or null if a secret was not found. |
| `setSecret`    | Takes a unique ID and a secret string as arguments and returns a promise that resolves if the secret was successfully saved.              |
| `deleteSecret` | Takes a unique ID as an argument and returns a promise that resolves if the secret was successfully deleted.                              |

> **NOTE:** The unique ID of an existing or deleted secret cannot be reused. If you pass a previously used ID to the `setSecret` function, an exception is raised.


## See Also

- [Encryption](../encryption.md)
