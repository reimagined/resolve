---
id: advanced-techniques
title: Advanced Techniques
---

## Splitting Code Into Chunks

ReSolve uses [webpack](https://webpack.js.org/) to transpile and bundle the application code so it can run on client browsers, the server and serverless platforms.

ReSolve takes advantage of webpack's code splitting functionality to split the bundles into chunks. A chunk can be server-only (for business logic), browser-only (for UI and client logic) or isomorphic (for view models on the server side and Redux reducers on the client).

When you build a reSolve application, the following chunks are generated:

- Command processor code - aggregate command handlers and projections (server only)
- View model projection (isomorphic)
- Read model projections and resolvers (server only)
- API handlers (server only)
- SSR renderer (server only, with peer dependencies with client, such as `styled-components`)
- The client application with UI (browser only)

All these chunks are used by the target application. Some chunks can include other chunks. For instance, the client includes the view model projection chunk to automatically generate Redux reducers.

In a cloud/serverless environment, chunks like read model projections & resolvers, SSR renderer, API handlers and REST business logic are distributed to appropriate cloud executors.

When an application runs locally, the `resolve-scripts` utility loads all necessary chunks and combines them with the runtime code.

## ReSolve Scripts

The resolve-scripts library provides scripts that serve as entry points for the fundamental stages of a reSolve application lifecycle. The package exports the following scripts:

| Script                      | Description                                                                    |
| --------------------------- | ------------------------------------------------------------------------------ |
| build                       | Builds the application.                                                        |
| start                       | Runs the built application.                                                    |
| watch                       | Runs the application in **watch** mode. (Watch application files for changes.) |
| runTestcafe                 | Runs TestCafe tests on the application.                                        |
| merge                       | Merges modules and application configs into a single object.                   |
| stop                        | Stops the application process.                                                 |
| reset                       | Resets the application's persistent storages and snapshots.                    |
| importEventStore            | Imports events from a file to the application's event store.                   |
| exportEventStore            | Exports events from the application's event store to a file.                   |
| validateConfig              |                                                                                |
| adjustWebpackReactNative    |                                                                                |
| adjustWebpackCommonPackages |                                                                                |
| defaultResolveConfig        |                                                                                |
| declareRuntimeEnv           |                                                                                |
| declareImportKey            |                                                                                |
| declareImportKey            |                                                                                |
| getModulesDirs              |                                                                                |
| showBuildInfo               |                                                                                |

## Adapters

ReSolve uses the **adapter** mechanism to provide an abstraction layer above APIs used by its subsystems. For instance, adapters are used to define how a reSolve application stores its data. They abstract away all direct interactions with the underlying storage, allowing reSolve to provide a unified data management API.

ReSolve uses different types of adapters depending on which kind of data needs to be stored.

- **Event store adapters**
- **Snapshot store adapters**
- **Read model store adapters**

Resolve comes with a set of adapters covering popular DBMS choices. You can also implement new adapters to store data in any required way.

Note that reSolve does not force you to use adapters. For example, you may need to implement a Read Model on top of some arbitrary system, such as a full-text-search engine, OLAP or a particular SQL database. In such case, you can just work with that system in the code of the projection function and query resolver, without writing a new Read Model adapter.

To learn more about a particular adapter type, refer to the documentation for the reSolve **[adapters](https://github.com/reimagined/resolve/tree/master/packages/adapters)** package.

## Modules

In reSolve, a module encapsulates a fragment of functionality that can be included by an application. A module can include any structural parts of a reSolve application in any combination.

A module is a standalone configuration object that can reference client code, read-side and write-side code, sagas and HTTP handlers. To include a module into your application, you need to initialize this object with any required additional settings and merge it into your application's centralized config:

##### run.js:

<!-- prettier-ignore-start -->

[embedmd]:# (../examples/hacker-news/run.js /^[[:blank:]]+const moduleAuth/ /^[[:blank:]]+\)/)
```js
  const moduleAuth = resolveModuleAuth([
    {
      name: 'local-strategy',
      createStrategy: 'auth/create_strategy.js',
      logoutRoute: {
        path: 'logout',
        method: 'POST'
      },
      routes: [
        {
          path: 'register',
          method: 'POST',
          callback: 'auth/route_register_callback.js'
        },
        {
          path: 'login',
          method: 'POST',
          callback: 'auth/route_login_callback.js'
        }
      ]
    }
  ])

  const baseConfig = merge(
    defaultResolveConfig,
    appConfig,
    moduleComments,
    moduleAuth
  )
```

<!-- prettier-ignore-end -->

A merged module's code is included in the resulting application's bundles.

For an example on how to use modules, see the [Hacker News](https://github.com/reimagined/resolve/tree/master/examples/hacker-news) sample application. This application uses the authentication and comments modules from reSolve.

## Upload Files

The **resolve-module-upload** module implements the file upload functionality. You can enable this module as shown below:

##### run.js:

```js
const moduleUploader = resolveModuleUploader({ jwtSecret })
...
const baseConfig = merge(
  defaultResolveConfig,
  appConfig,
  moduleAuth,
  moduleUploader
)
```

The **resolve-module-upload** module adds the following API endpoints to an application:

- `/api/uploader/getFormUpload` - Returns an upload path to use in HTTP forms.
- `/api/uploader/getUploadUrl` - Returns a path used to upload files.
- `/api/uploader/getToken` - Takes user credentials and returns the user's authorization token.

The [cli-uploader](https://github.com/reimagined/resolve/tree/master/examples/cli-uploader) example application demonstrates how to design a file uploader utility and handle file uploads on the server.
