# **resolve-storage-mysql**
[![npm version](https://badge.fury.io/js/resolve-storage-mysql.svg)](https://badge.fury.io/js/resolve-storage-mysql)

This package is a `resolve-es` adapter for storing events using MySQL.

## Available Parameters

* `tableName` - a name of a table storing events.
* `...connectionSettings` - see [Connection Settings](https://www.npmjs.com/package/mysql2#first-query) for more information.

## Usage

```js
import createAdapter from 'resolve-storage-mysql'

const adapter = createAdapter({
  host: 'localhost',
  port: 3306,
  user: 'customUser',
  password: 'customPassword',
  database: 'customDatabaseName',
  tableName: 'customTableName'
})
```

![Analytics](https://ga-beacon.appspot.com/UA-118635726-1/packages-resolve-storage-mysql-readme?pixel)
