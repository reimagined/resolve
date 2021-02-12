# **resolve-readmodel-postgresql**
[![npm version](https://badge.fury.io/js/resolve-readmodel-postgresql.svg)](https://badge.fury.io/js/resolve-readmodel-postgresql)
 
A **Read Model Adapter** for [PostgreSQL 10.7](https://www.postgresql.org) database server.
The adapter provides a query API for projection and resolvers. This API is similar to the other reSolve adapters API, which means you can change a **Read Model Adapter** in the configuration file without changing the code.

## Available Parameters
* `databaseName` - The name of the PostgreSQL [schema](https://www.postgresql.org/docs/10/dl-schemas.html).
* `tablePrefix` - optional table prefix for read-models server by current adapter instance.
* `user` - a name of an user.
* `password` - a password of an user.
* `database` - a name of a database.
* `host` - a host of a database server.
* `port` - a port of a database server.
* `preferEventBusLedger` - store ledger in event bus instead read-model database itself.

Adapter interface is provided by **resolve-readmodel-base** package.

## Usage

```js
import createAdapter from '@reimagined/readmodel-postgresql'

const adapter = createAdapter({
  databaseName,
  ...connectionSettings
})
```
