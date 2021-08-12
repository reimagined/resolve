# **resolve-readmodel-mysql**

[![npm version](https://badge.fury.io/js/resolve-readmodel-mysql.svg)](https://badge.fury.io/js/resolve-readmodel-mysql)

A **Read Model Adapter** for [MySQL](https://www.mysql.com/) 5.7+ and compatible (like [AWS Aurora](https://aws.amazon.com/rds/aurora/)) databases.
The adapter provides a query API for projection and resolvers. This API is standard among reSolve read model adapters, so you can change a **Read Model Adapter** in the configuration file without changing the code.

## Available Parameters

- `...connectionSettings` - see [Connection Settings](https://www.npmjs.com/package/mysql2#first-query) for more information.

The adapter interface is defined in the **@resolve-js/readmodel-base** package.

## Usage

```js
import createAdapter from '@resolve-js/readmodel-mysql'

const adapter = createAdapter({
  ...connectionSettings,
})
```

## Notes:

- Index fields can store only numbers of the `BIGINT` type or strings in the `utf8mb4` encoding with the `utf8mb4_unicode_ci` collation ([details](https://dev.mysql.com/doc/refman/5.5/en/charset-unicode-utf8mb4.html)).
- Other fields are stored in a `json` column as `longblob` ([details](https://dev.mysql.com/doc/refman/5.7/en/json.html))
- The maximum packet size is limited. You can configure it in the [MySQL server options](https://dev.mysql.com/doc/refman/5.7/en/server-system-variables.html#sysvar_max_allowed_packet)
- Double-check the encoding of connection names, requests, and responses: the encoding-related bugs are hard to catch.

![Analytics](https://ga-beacon.appspot.com/UA-118635726-1/packages-resolve-readmodel-mysql-readme?pixel)
