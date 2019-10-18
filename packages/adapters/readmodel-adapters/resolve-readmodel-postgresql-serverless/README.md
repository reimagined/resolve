# **resolve-readmodel-postgresql-serverless**
[![npm version](https://badge.fury.io/js/resolve-readmodel-postgresql-serverless.svg)](https://badge.fury.io/js/resolve-readmodel-postgresql-serverless)
 
A **Read Model Adapter** for AWS Aurora [PostgreSQL](https://www.postgresql.org) serverless database via RDS Data API.
The adapter provides a query API for projection and resolvers. This API is similar to the other reSolve adapters API, which means you can change a **Read Model Adapter** in the configuration file without changing the code.

## Available Parameters

* `dbClusterOrInstanceArn` - The Amazon Resource Name (ARN) of the Aurora Serverless DB cluster.
* `awsSecretStoreArn` - The name or ARN of the secret that enables access to the DB cluster.
* `databaseName` - The name of the PostgreSQL [schema](https://www.postgresql.org/docs/10/ddl-schemas.html).
* `tablePrefix` - optional table prefix for read-models server by current adapter instance.
* `...connectionSettings` - see [RDS Data Service API](https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/RDSDataService.html) for more information.

Adapter interface is provided by **resolve-readmodel-base** package.

## Usage

```js
import createAdapter from 'resolve-readmodel-postgresql-serverless'

const adapter = createAdapter({
  databaseName,
  ...connectionSettings
})
```
