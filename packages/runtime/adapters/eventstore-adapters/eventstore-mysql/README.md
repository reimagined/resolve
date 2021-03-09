# **@resolve-js/eventstore-mysql**

[![npm version](https://badge.fury.io/js/@resolve-js/eventstore-mysql.svg)](https://badge.fury.io/js/@resolve-js/eventstore-mysql)

This package is an eventstore adapter for storing events using MySQL 8.0.

## Available Parameters

- `eventsTableName` - a name of a table storing events.
- `...connectionSettings` - see [Connection Settings](https://www.npmjs.com/package/mysql2#first-query) for more information.

## Usage

```js
import createAdapter from '@resolve-js/eventstore-mysql'

const adapter = createAdapter({
  host: 'localhost',
  port: 3306,
  user: 'customUser',
  password: 'customPassword',
  database: 'customDatabaseName',
  eventsTableName: 'customTableName',
})
```

![Analytics](https://ga-beacon.appspot.com/UA-118635726-1/packages-resolve-eventstore-mysql-readme?pixel)
