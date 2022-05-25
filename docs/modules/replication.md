---
id: replication
title: Replication
---

# Replication Module

The reSolve replication module [@resolve-js/module-replication](https://www.npmjs.com/package/@resolve-js/module-replication) adds API handlers required to create the application's replica by cloning its events.

## Installation

Use the following console input to install the authentication module:

```sh
yarn add @resolve-js/module-replication
```

## Register and Configure the Module

Register the installed module in the project's `run.js` file:

```js
import resolveModuleReplication from '@resolve-js/module-replication'
...
const moduleReplication = resolveModuleReplication()
const resolveConfig = merge(
  baseConfig,
  devReplicaConfig,
  moduleReplication,
  ...
)
```

## Preparing a Replica Instance

A replica application requires a read model configured to use the `replicator` connector:

```js title="config.dev.js"
readModels: [
  {
    name: 'Replicator',
    projection: 'common/read-models/empty.js',
    resolvers: 'common/read-models/empty.js',
    connectorName: 'replicator',
  },
],
readModelConnectors: {
  ...devCommonConfig.readModelConnectors,
  replicator: {
  module: '@resolve-js/replicator-via-api-handler',
    options: {
      targetApplicationUrl: declareRuntimeEnv('TARGET_REPLICATION_URL', ''),
    },
  },
},
```

## Example

The Hacker New example application contains run scripts for both the master and replica instances.
