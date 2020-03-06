# **resolve-snapshot-postgres-serverless**
[![npm version](https://badge.fury.io/js/resolve-snapshot-postgresql-serverless.svg)](https://badge.fury.io/js/resolve-snapshot-postgres-serverless)

This package is an adapter for storing snapshots using AWS Aurora Serverless PostgreSQL 10.7.

## Available Parameters

* `awsSecretStoreArn` - an AWS Secret store ARN.
* `dbClusterOrInstanceArn` - a database cluster or instance ARN.
* `databaseName` - a name of a database storing snapshots.
* `tableName` - a name of a table storing snapshots.
* `region` - an AWS region.
* `bucketSize` - the bucket size.

## Usage
```
import createSnapshotAdapter from 'resolve-snapshot-postgres-serverless'

const snapshotAdapter = createSnapshotAdapter({
  awsSecretStoreArn: 'awsSecretStoreArn',
  dbClusterOrInstanceArn: 'dbClusterOrInstanceArn',
  databaseName: 'databaseName',
  tableName: 'tableName',
  region: 'region',
  bucketSize
})

await snapshotAdapter.loadSnapshot(key)
await snapshotAdapter.saveSnapshot(key, value)
await snapshotAdapter.drop(key)
await snapshotAdapter.dispose()
```

![Analytics](https://ga-beacon.appspot.com/UA-118635726-1/packages-resolve-snapshot-postgres-serverless-readme?pixel)
