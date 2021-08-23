# **@resolve-js/readmodel-postgresql**

[![npm version](https://badge.fury.io/js/%40resolve-js%2Freadmodel-postgresql.svg)](https://badge.fury.io/js/%40resolve-js%2Freadmodel-postgresql)

A **Read Model Adapter** for [PostgreSQL 10.7](https://www.postgresql.org) database server.
The adapter provides a query API for projection and resolvers. This API is standard among reSolve read model adapters, so you can change a **Read Model Adapter** in the configuration file without changing the code.

## Available Parameters

- `databaseName` - The name of the PostgreSQL [schema](https://www.postgresql.org/docs/10/ddl-schemas.html).
- `tablePrefix` - An optional table prefix for read-models server by current adapter instance.
- `user` - The name of a user.
- `password` - The user's password.
- `database` - The database name.
- `host` - The database server's host name.
- `port` - The database server's port.

The adapter interface is defined in the **@resolve-js/readmodel-base** package.

## Usage

```js
import createAdapter from '@resolve-js/readmodel-postgresql'

const adapter = createAdapter({
  databaseName,
  ...connectionSettings,
})
```
