# **@resolve-js/readmodel-postgresql-serverless**

[![npm version](https://badge.fury.io/js/%40resolve-js%2Freadmodel-postgresql-serverless.svg)](https://badge.fury.io/js/%40resolve-js%2Freadmodel-postgresql-serverless)

A **Read Model Adapter** for AWS Aurora [PostgreSQL](https://www.postgresql.org) serverless database via RDS Data API.
The adapter provides a query API for projection and resolvers. This API is standard among reSolve read model adapters, so you can change a **Read Model Adapter** in the configuration file without changing the code.

## Available Parameters

- `dbClusterOrInstanceArn` - The Amazon Resource Name (ARN) of the Aurora Serverless DB cluster.
- `awsSecretStoreArn` - The name or ARN of the secret that enables access to the DB cluster.
- `databaseName` - The name of the PostgreSQL [schema](https://www.postgresql.org/docs/10/ddl-schemas.html).
- `tablePrefix` - An optional table prefix for read-models server by current adapter instance.
- `...connectionSettings` - See [RDS Data Service API](https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/RDSDataService.html) for more information.

The adapter interface is defined in the **@resolve-js/readmodel-base** package.

## Usage

```js
import createAdapter from '@resolve-js/readmodel-postgresql-serverless'

const adapter = createAdapter({
  databaseName,
  ...connectionSettings,
})
```
