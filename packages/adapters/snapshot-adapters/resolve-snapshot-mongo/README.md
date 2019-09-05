# **resolve-snapshot-mongo**
[![npm version](https://badge.fury.io/js/resolve-snapshot-mongo.svg)](https://badge.fury.io/js/resolve-snapshot-mongo)

This package is an adapter for storing snapshots using MongoDB.

## Available Parameters

* `url` - the connection URI string.
* `tableName` - the table name.
* `bucketSize` - the bucket size.

## Usage
```
import createSnapshotAdapter from 'resolve-snapshot-mongo'

const snapshotAdapter = createSnapshotAdapter({
  url: 'mongodb://[username:password@]host1[:port1][,...hostN[:portN]]][/[database][?options]]',
  tableName: 'TableName',
  bucketSize: 100
})

await snapshotAdapter.loadSnapshot(key)
await snapshotAdapter.saveSnapshot(key, value)
await snapshotAdapter.dispose()
```

![Analytics](https://ga-beacon.appspot.com/UA-118635726-1/packages-resolve-snapshot-mongo-readme?pixel)






