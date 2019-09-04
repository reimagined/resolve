# **resolve-snapshot-mongo**
[![npm version](https://badge.fury.io/js/resolve-snapshot-mongo.svg)](https://badge.fury.io/js/resolve-snapshot-mongo)

This package is an adapter for storing snapshots using MongoDB.

## Available Parameters

* `bucketSize` - the bucket size.
* `databaseFile` - the path to a file where snapshots are stored. Notice, if that argument is not passed the adapter uses memory to store snapshots. In this case, all data is lost when an application instance is restarted.

## Usage
```
import createSnapshotAdapter from 'resolve-snapshot-mongo'

const snapshotAdapter = createSnapshotAdapter({
  url: 'mongodb://[username:password@]host1[:port1][,...hostN[:portN]]][/[database][?options]]',
  collectionName: 'CollectionName',
  bucketSize: 100
})

await snapshotAdapter.loadSnapshot(key)
await snapshotAdapter.saveSnapshot(key, value)
await snapshotAdapter.dispose({ dropSnapshots: true })
```

![Analytics](https://ga-beacon.appspot.com/UA-118635726-1/packages-resolve-snapshot-mongo-readme?pixel)






