# **@resolve-js/eventstore-mysql**

[![npm version](https://badge.fury.io/js/%40resolve-js%2Feventstore-mysql.svg)](https://badge.fury.io/js/%40resolve-js%2Feventstore-mysql)

This package is an event store adapter used to store events in MySQL 8.0.

## Available Parameters

- `eventsTableName` - the name of a table used to store events.
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
