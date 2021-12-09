---
id: running-in-containers
title: Running in Containers
---

Follow the steps below to run a reSolve application in a Docker container:

### 1. Configure the reSolve Application

Add a separate application configuration file used to build the application as a part of a Docker image:

```js
import { declareRuntimeEnv } from '@resolve-js/scripts'

const dockerConfig = {
  mode: 'production',
  runtime: {
    module: '@resolve-js/runtime-single-process',
    options: {
      host: declareRuntimeEnv('HOST', 'localhost'),
      port: declareRuntimeEnv('PORT', '3000'),
    },
  },
  eventstoreAdapter: {
    module: '@resolve-js/eventstore-postgresql',
    options: {
      databaseName: declareRuntimeEnv('RESOLVE_EVENT_STORE_DATABASE_NAME'),
      host: declareRuntimeEnv('RESOLVE_EVENT_STORE_CLUSTER_HOST'),
      port: declareRuntimeEnv('RESOLVE_EVENT_STORE_CLUSTER_PORT'),
      user: declareRuntimeEnv('RESOLVE_USER'),
      password: declareRuntimeEnv('RESOLVE_USER_PASSWORD'),
      database: 'postgres',
    },
  },
  readModelConnectors: {
    default: {
      module: '@resolve-js/readmodel-postgresql',
      options: {
        databaseName: declareRuntimeEnv('RESOLVE_READMODEL_DATABASE_NAME'),
        host: declareRuntimeEnv('RESOLVE_READMODEL_CLUSTER_HOST'),
        port: declareRuntimeEnv('RESOLVE_READMODEL_CLUSTER_PORT'),
        user: declareRuntimeEnv('RESOLVE_USER'),
        password: declareRuntimeEnv('RESOLVE_USER_PASSWORD'),
        database: 'postgres',
      },
    },
    hackerNews: {
      module: '@resolve-js/readmodel-postgresql',
      options: {
        databaseName: declareRuntimeEnv('RESOLVE_READMODEL_DATABASE_NAME'),
        host: declareRuntimeEnv('RESOLVE_READMODEL_CLUSTER_HOST'),
        port: declareRuntimeEnv('RESOLVE_READMODEL_CLUSTER_PORT'),
        user: declareRuntimeEnv('RESOLVE_USER'),
        password: declareRuntimeEnv('RESOLVE_USER_PASSWORD'),
        database: 'postgres',
      },
    },
    comments: {
      module: '@resolve-js/readmodel-postgresql',
      options: {
        databaseName: declareRuntimeEnv('RESOLVE_READMODEL_DATABASE_NAME'),
        host: declareRuntimeEnv('RESOLVE_READMODEL_CLUSTER_HOST'),
        port: declareRuntimeEnv('RESOLVE_READMODEL_CLUSTER_PORT'),
        user: declareRuntimeEnv('RESOLVE_USER'),
        password: declareRuntimeEnv('RESOLVE_USER_PASSWORD'),
        database: 'postgres',
      },
    },
    elasticSearch: {
      module: 'common/read-models/elastic-search-connector.ts',
      options: {
        /*
        host: '<your-production-elastic-search-host>'
        */
      },
    },
  },
  jwtCookie: {
    name: 'jwt',
    maxAge: 31536000000,
  },
}

export default dockerConfig
```

Register the added configuration file in `run.js`:

```js
import dockerConfig from './config.docker'
...
void (async () => {
  try {
    ...
    switch (launchMode) {
      ...
      case 'build:docker': {
        const resolveConfig = merge(baseConfig, dockerConfig)
        await build(resolveConfig, adjustWebpackConfigs)
        break
      }
    }
  } catch (error) {
    await stop(error)
  }
})()
```

Register a `"build:docker"` script in the application's `package.json` file:

```json
...
"scripts": {
    ...
    "build:docker": "ts-node run.ts build:docker",
    ...
}
...
```

### 2. Configure PostgreSQL

The official [PostgreSQL](https://hub.docker.com/_/postgres/) docker image runs SQL scripts found in the `/docker-entrypoint-initdb.d/` folder to initialize the hosted databases.

To initialize the database credentials and schemas required to run reSolve, create a directory to mount as the `/docker-entrypoint-initdb.d/` volume and add the following script to this directory:

```sql
\c postgres;
-- Add user credetials for your reSolve applciation.
CREATE USER "hn-user";
ALTER USER "hn-user" PASSWORD 'QweZxc123';

-- Grant the created user the required rights.
CREATE SCHEMA "event-store";
GRANT USAGE ON SCHEMA "event-store" TO "hn-user";
GRANT ALL ON SCHEMA "event-store" TO "hn-user";
GRANT ALL ON ALL TABLES IN SCHEMA "event-store" TO "hn-user";
GRANT ALL ON ALL SEQUENCES IN SCHEMA "event-store" TO "hn-user";
GRANT ALL ON ALL FUNCTIONS IN SCHEMA "event-store" TO "hn-user";
ALTER SCHEMA "event-store" OWNER TO "hn-user";

CREATE SCHEMA "read-store";
GRANT USAGE ON SCHEMA "read-store" TO "hn-user";
GRANT ALL ON SCHEMA "read-store" TO "hn-user";
GRANT ALL ON ALL TABLES IN SCHEMA "read-store" TO "hn-user";
GRANT ALL ON ALL SEQUENCES IN SCHEMA "read-store" TO "hn-user";
GRANT ALL ON ALL FUNCTIONS IN SCHEMA "read-store" TO "hn-user";
ALTER SCHEMA "read-store" OWNER TO "hn-user";
```

### 3. Configure Nginx

### 4. Prepare the Dockerfile

### 5. Configure Docker Compose

### 6. Build the Image and Run the Container

The [Hacker News](https://github.com/reimagined/resolve/tree/dev/examples/js/hacker-news) example project contains all configuration files required to build a docker image and run it with Docker Compose.
