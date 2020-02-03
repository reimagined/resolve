# **resolve-storage-postgresql**
[![npm version](https://badge.fury.io/js/resolve-storage-postgresql.svg)](https://badge.fury.io/js/resolve-storage-postgresql)

This package is a `resolve-es` adapter for storing events using PostgreSQL 10.7.

## Available Parameters

* `databaseName` - a name of a schema storing events.
* `tableName` - a name of a table storing events.
* `user` - a name of an user.
* `password` - a password of an user.
* `database` - a name of a database.
* `host` - a host of a database server.
* `port` - a port of a database server.


## Usage

```js
import createAdapter from 'resolve-storage-postgresql'

const adapter = createAdapter({
  user: 'user',
  password: 'password',
  database: 'postgres',
  host: 'localhost',
  port: 5432,
  databaseName: 'public',
  tableName: 'events'
})
```

![Analytics](https://ga-beacon.appspot.com/UA-118635726-1/packages-resolve-storage-postgresql-readme?pixel)

