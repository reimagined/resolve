---
id: preparing-to-production
title: Preparing to Production
---

## Configuration Options

When you move your application to production, you need to perform all required configurations according to your production environment's specifics.

An application is built for production using the **build** script, and run in the production mode using the **start** script. By default, an application that runs in the production mode takes into account settings specifies in the **prodConfig** configuration object (the **config.prod.js** file). However, you can use other config structure as long as you properly register it in the **run.js** file.

An example **config.prod.js** file:

<!-- prettier-ignore-start -->

[embedmd]:# (../examples/hacker-news/config.prod.js /^/ /\n$/)
```js
const prodConfig = {
  port: 3000,
  polyfills: ['@babel/polyfill'],
  mode: 'production',
  readModelConnectors: {
    HackerNews: {
      module: 'resolve-readmodel-lite',
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

Before you move your app into production, specify all required [adapters](advanced-techniques.md#adapters) in the production config.

Depending on your requirements, you may want to specify storage adapters for events, Read Model data and View Model snapshots.

The code below demonstrates how to set up a storage adapter on the example of an in-memory Read Model storage:

<!-- prettier-ignore-start -->

[embedmd]:# (../examples/hacker-news/config.prod.js /readModelConnectors/ /\},/)
```js
readModelConnectors: {
    HackerNews: {
      module: 'resolve-readmodel-lite',
      options: {}
    }
  },
```

<!-- prettier-ignore-end -->

In addition to storage adapters, you can specify adapters that define how your application communicates with underlying APIs. For example, use the API handler adapters, to define how your application handles API requests.
You can also provide a bus adapter and subscribe adapter to define how your application sends events and subscribes to events.

to familiarize yourself with the available adapters, see the **[adapters](https://github.com/reimagined/resolve/tree/master/packages/adapters)** package documentation.

## Using Environment Variables

Use the **declareRuntimeEnv** function from the **resolve-scripts** library to bind a configuration setting value to an environment variable:

```js
import { declareRuntimeEnv } from 'resolve-scripts'
export default {
  subscribeAdapter: {
    module: 'resolve-subscribe-mqtt',
    options: {}
  },
  readModels: [
    {
      name: 'deployments',
      projection: 'common/read-models/deployments/projection.js',
      resolvers: 'common/read-models/deployments/resolvers.js',
      adapter: {
        module: 'resolve-readmodel-mysql',
        options: {
          host: declareRuntimeEnv('RESOLVE_READMODEL_SQL_HOST'),
          database: declareRuntimeEnv('RESOLVE_READMODEL_SQL_DATABASE'),
          user: declareRuntimeEnv('RESOLVE_READMODEL_SQL_USER'),
          password: declareRuntimeEnv('RESOLVE_READMODEL_SQL_PASSWORD')
        }
      }
    }
  ]
}
```

This approach is useful when you need to assign settings that should not be included in application sources (e.g., authentication credentials or secret keys) or settings that should be defined by a server instance.
