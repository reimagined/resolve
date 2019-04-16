# **resolve-snapshot-mysql**
[![npm version](https://badge.fury.io/js/resolve-snapshot-mysql.svg)](https://badge.fury.io/js/resolve-snapshot-mysql)

This package is an adapter for storing snapshots using MySQL.

## Available Parameters

* `bucketSize` - the bucket size.
* `tableName` - the name of a table storing snapshots.
* `...connectionSettings` - see [Connection Settings](https://www.npmjs.com/package/mysql2#first-query) for more information.

## Usage
```
import createSnapshotAdapter from 'resolve-snapshot-mysql'

const snapshotAdapter = createSnapshotAdapter({
  bucketSize: 100,
  tableName, 
  ...connectionOptions
})

await snapshotAdapter.loadSnapshot(key)
await snapshotAdapter.saveSnapshot(key, value)
await snapshotAdapter.dispose({ dropSnapshots: true })
```

![Analytics](https://ga-beacon.appspot.com/UA-118635726-1/packages-resolve-snapshot-mysql-readme?pixel)
