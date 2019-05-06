# **resolve-snapshot-lite**
[![npm version](https://badge.fury.io/js/resolve-snapshot-lite.svg)](https://badge.fury.io/js/resolve-snapshot-lite)

This package is an adapter for storing snapshots using a file or memory. It does not have binary dependencies and does not require additional applications (like MongoDB or SQL server).

## Available Parameters

* `bucketSize` - the bucket size.
* `databaseFile` - the path to a file where snapshots are stored. Notice, if that argument is not passed the adapter uses memory to store snapshots. In this case, all data is lost when an application instance is restarted.

## Usage
```
import createSnapshotAdapter from 'resolve-snapshot-lite'

const snapshotAdapter = createSnapshotAdapter({
  databaseFile: 'path/to/file',
  bucketSize: 100
})

await snapshotAdapter.loadSnapshot(key)
await snapshotAdapter.saveSnapshot(key, value)
await snapshotAdapter.dispose({ dropSnapshots: true })
```

![Analytics](https://ga-beacon.appspot.com/UA-118635726-1/packages-resolve-snapshot-lite-readme?pixel)






