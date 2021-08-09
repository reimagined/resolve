# **@resolve-js/eventstore-postgresql-serverless**

[![npm version](https://badge.fury.io/js/%40resolve-js%2Feventstore-postgresql-serverless.svg)](https://badge.fury.io/js/%40resolve-js%2Feventstore-postgresql-serverless)

This package is an event store adapter used to store events in AWS Aurora Serverless PostgreSQL 10.7.

## Available Parameters

- `databaseName` - the name of a database used to store events.
- `eventsTableName` - the name of a table used to store events.
- `awsSecretStoreArn` - an AWS Secret store ARN.
- `dbClusterOrInstanceArn` - a database cluster or instance ARN.
- `region` - an AWS region.

## Usage

```js
import createAdapter from '@resolve-js/eventstore-postgresql-serverless'

const adapter = createAdapter({
  region: 'us-east-1',
  databaseName: 'databaseName',
  eventsTableName: 'eventsTableName',
  awsSecretStoreArn: 'awsSecretStoreArn',
  dbClusterOrInstanceArn: 'dbClusterOrInstanceArn',
})
```

#### As Resource

```js
import {
  create,
  dispose,
  destroy,
} from '@resolve-js/eventstore-postgresql-serverless'

await create({
  region: 'us-east-1',
  awsSecretStoreAdminArn: 'awsSecretStoreAdminArn',
  dbClusterOrInstanceArn: 'dbClusterOrInstanceArn',
  databaseName: 'creatingDatabaseName',
  eventsTableName: 'creatingTableName',
  userLogin: 'creatingUserLogin',
  userPassword: 'creatingUserPassword',
})

await dispose({
  region: 'us-east-1',
  awsSecretStoreAdminArn: 'awsSecretStoreAdminArn',
  dbClusterOrInstanceArn: 'dbClusterOrInstanceArn',
  databaseName: 'disposingDatabaseName',
  eventsTableName: 'disposingTableName',
  userLogin: 'disposingUserLogin',
  userPassword: 'disposingUserPassword',
})

await destroy({
  region: 'us-east-1',
  awsSecretStoreAdminArn: 'awsSecretStoreAdminArn',
  dbClusterOrInstanceArn: 'dbClusterOrInstanceArn',
  databaseName: 'destroyingDatabaseName',
  userLogin: 'destroyingUserLogin',
})
```

![Analytics](https://ga-beacon.appspot.com/UA-118635726-1/packages-@resolve-js/eventstore-postgresql-serverless-readme?pixel)
