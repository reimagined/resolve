# **resolve-storage-mysql-serverless**
[![npm version](https://badge.fury.io/js/resolve-storage-mysql-serverless.svg)](https://badge.fury.io/js/resolve-storage-mysql)

This package is a `resolve-es` adapter for storing events using AWS Aurora Serverless MySQL 5.6.

## Available Parameters

* `databaseName` - a name of a database storing events.
* `tableName` - a name of a table storing events.
* `awsSecretStoreArn` - an AWS Secret store ARN.
* `dbClusterOrInstanceArn` - a database cluster or instance ARN.

## Usage

```js
import createAdapter from 'resolve-storage-mysql-serverless'

const adapter = createAdapter({
  databaseName: 'databaseName',
  tableName: 'tableName',
  awsSecretStoreArn: 'awsSecretStoreArn',
  dbClusterOrInstanceArn: 'dbClusterOrInstanceArn',
  skipInit: true
})
```

#### As Resource
```js
import { create, dispose, destroy } from 'resolve-storage-dynamo'

await create({ 
  awsSecretStoreArn: 'awsSecretStoreArn',
  dbClusterOrInstanceArn: 'dbClusterOrInstanceArn',
  databaseName: 'creatingDatabaseName',
  tableName: 'creatingTableName',
  userLogin: 'creatingUserLogin',
  userPassword: 'creatingUserPassword'
})

await dispose({ 
  awsSecretStoreArn: 'awsSecretStoreArn',
  dbClusterOrInstanceArn: 'dbClusterOrInstanceArn',
  databaseName: 'disposingDatabaseName',
  tableName: 'disposingTableName',
  userLogin: 'disposingUserLogin',
  userPassword: 'disposingUserPassword'
})

await destroy({ 
  awsSecretStoreArn: 'awsSecretStoreArn',
  dbClusterOrInstanceArn: 'dbClusterOrInstanceArn',
  databaseName: 'destroyingDatabaseName',
  userLogin: 'destroyingUserLogin'
})
```

![Analytics](https://ga-beacon.appspot.com/UA-118635726-1/packages-resolve-storage-mysql-serverless-readme?pixel)

