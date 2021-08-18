# **@resolve-js/eventstore-postgresql**

[![npm version](https://badge.fury.io/js/%40resolve-js%2Feventstore-postgresql.svg)](https://badge.fury.io/js/%40resolve-js%2Feventstore-postgresql)

This package is an event store adapter used to store events in PostgreSQL 10.7.

## Available Parameters

- `databaseName` - the name of a [schema](https://www.postgresql.org/docs/10/ddl-schemas.html) used to store events.
- `eventsTableName` - the name of a table used to store events.
- `user` - the user name.
- `password` - a user's password.
- `database` - the name of a database.
- `host` - a database server's host name.
- `port` - a database server's port.

## Usage

```js
import createAdapter from '@resolve-js/eventstore-postgresql'

const adapter = createAdapter({
  user: 'user',
  password: 'password',
  database: 'postgres',
  host: 'localhost',
  port: 5432,
  databaseName: 'public',
  eventsTableName: 'events',
})
```

![Analytics](https://ga-beacon.appspot.com/UA-118635726-1/packages-@resolve-js/eventstore-postgresql-readme?pixel)
