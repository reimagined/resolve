---
id: preparing-to-production
title: Preparing to Production
description: This document describes how to prepare a reSolve application for deployment to a production server environment.
---

## Configuration Options

When you move your application to production, you need to perform all required configurations according to your production environment's specifics.

An application is built for production using the **build** script, and run in the production mode using the **start** script. By default, an application that runs in the production mode takes into account settings specifies in the **prodConfig** configuration object (the **config.prod.js** file). However, you can use other config structure as long as you properly register it in the **run.js** file.

An example **config.prod.js** file:

<!-- prettier-ignore-start -->

[embedmd]:# (../examples/js/hacker-news/config.prod.js /^/ /\n$/)
```js
const prodConfig = {
  port: 3000,
  mode: 'production',
  readModelConnectors: {
    HackerNews: {
      module: '@resolve-js/readmodel-lite',
      options: {}
    }
  },
  jwtCookie: {
    name: 'jwt',
    maxAge: 31536000000
  }
}

export default prodConfig
```

<!-- prettier-ignore-end -->

## Configuring Adapters

Before you move your app into production, specify all required [adapters](adapters.md) in the production config.

Depending on your requirements, you may want to specify storage adapters for events, Read Model data and View Model snapshots.

The code below demonstrates how to set up a storage adapter on the example of an in-memory Read Model storage:

<!-- prettier-ignore-start -->

[embedmd]:# (../examples/js/hacker-news/config.prod.js /readModelConnectors/ /\},/)
```js
readModelConnectors: {
    HackerNews: {
      module: '@resolve-js/readmodel-lite',
      options: {}
    }
  },
```

<!-- prettier-ignore-end -->

In addition to storage adapters, you can specify adapters that define how your application communicates with underlying APIs. For example, use the API handler adapters, to define how your application handles API requests.
You can also provide a bus adapter and subscribe adapter to define how your application sends events and subscribes to events.

## Using Environment Variables

Use the **declareRuntimeEnv** function from the **@resolve-js/scripts** library to bind a configuration setting value to an environment variable:

```js
import { declareRuntimeEnv } from '@resolve-js/scripts'
export default {
  subscribeAdapter: {
    module: '@resolve-js/subscribe-mqtt',
    options: {},
  },
  readModelsConnectors: {
    HackerNews: {
      module: '@resolve-js/readmodel-postgresql',
      options: {
        databaseName: declareRuntimeEnv('RESOLVE_READMODEL_DATABASE_NAME'),
        host: declareRuntimeEnv('RESOLVE_READMODEL_CLUSTER_HOST'),
        port: declareRuntimeEnv('RESOLVE_READMODEL_CLUSTER_PORT'),
        user: declareRuntimeEnv('RESOLVE_USER_ID'),
        password: declareRuntimeEnv('RESOLVE_USER_PASSWORD'),
        database: 'postgres',
      },
    },
  },
}
```

This approach is useful when you need to assign settings that should not be included in application sources (e.g., authentication credentials or secret keys) or settings that should be defined by a server instance.
