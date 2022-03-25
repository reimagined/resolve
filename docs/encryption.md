---
id: encryption
title: Encryption
---

## Overview

The reSolve framework includes a mechanism that allows you to use an arbitrary encryption algorithm to encrypt the stored events and Read Model state data. You can use this functionality to store user data in compliance with General Data Protection Regulation (GDPR).

Encryption is defined in a file that exports a factory function of the following format:

**Aggregate Encryption:**

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

**Read Model Encryption:**

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

You can assign encryption to aggregates and read models in the application's configuration file as shown below:

```js
const appConfig = {
  aggregates: [
    {
      name: 'user-profile',
      commands: 'common/aggregates/user-profile.commands.js',
      projection: 'common/aggregates/user-profile.projection.js',
      encryption: 'common/aggregates/encryption.js', // The path to a file that defines aggregate encryption
    },
    ...
  ]
  readModels: [
    {
      name: 'user-profiles',
      connectorName: 'default',
      projection: 'common/read-models/user-profiles.projection.js',
      resolvers: 'common/read-models/user-profiles.resolvers.js',
      encryption: 'common/read-models/encryption.js', // The path to a file that defines Read Model encryption
    },
    ...
  ],
  ...
}
```

## Storing Secrets

The reSolve framework implements a **secrets manager** that you can use to get, set or delete secrets based on their unique IDs. In an encryption factory function, you can access the secrets manager through the reSolve context object:

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

| Function Name                                                    | Description                                                                                                                               |
| ---------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| [`getSecret`](api/encryption/secrets-manager.md#getsecret)       | Takes a unique ID as an argument and returns a promise that resolves to a string if a secret was found or `null` if a secret was not found. |
| [`setSecret`](api/encryption/secrets-manager.md#setsecret)       | Takes a unique ID and a secret string as arguments and returns a promise that resolves if the secret was successfully saved.              |
| [`deleteSecret`](api/encryption/secrets-manager.md#deletesecret) | Takes a unique ID as an argument and returns a promise that resolves if the secret was successfully deleted.                              |

:::caution
The unique ID of an existing or deleted secret cannot be reused. If you pass a previously used ID to the [`setSecret`](#setsecret) function, an exception is raised.
:::

The secrets manager stores secrets in the 'secrets' table within the event store. To change the table name, use the event store adapter's `secretsTableName` option:

```js
// config.prod.js
const prodConfig = {
  eventstoreAdapter: {
    module: '@resolve-js/eventstore-lite',
    options: {
      databaseFile: 'data/event-store.db',
      secretsTableName: 'usersecrets',
    },
  },
}
```

## Example

The [personal-data](https://github.com/reimagined/resolve/tree/dev/examples/js/personal-data) example demonstrates how to store encrypted user data. In this example, the encryption logic is implemented in a separate `common/encryption-factory.js` file and reused on both the read and write sides.
