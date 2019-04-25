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

## Server-Side Rendering

ReSolve provides the Server-Side rendering (SSR) functionality for React code without any additional configurations. This means that reSolve application pages are always pre-rendered before they are sent to the client browser. Note that server-side rendering is currently performed only for static content, without pre-fetching data.

#### Managing Routes

ReSolve uses the [react-router](https://github.com/ReactTraining/react-router) library to perform routing. The [react-router-config](https://github.com/ReactTraining/react-router/tree/master/packages/react-router-config) library is also used to provide a centralized route config that can be used both on the server and client sides. You can define routes as shown below:

```js
const routes = [
  {
    component: Root,
    routes: [
      { path: '/', exact: true, component: Home },
      {
        path: '/child/:id',
        component: Child,
        routes: [{ path: '/child/:id/grand-child', component: GrandChild }]
      }
    ]
  }
]
```

In this code sample, each route is specified by an object whose fields correspond to the [\<Route\>](https://reacttraining.com/react-router/web/api/Route) component's props.

To register routes within a reSolve app, specify the path to the file containing routs definition in the **routes** config section:

```js
routes: 'client/routes.js'
```

After this, app routing is configured for server-side rendering. On the client, routing is also performed as expected: when you render a [\<Redirect\>](https://reacttraining.com/react-router/web/api/Redirect), the browser switches to the new location, and this location is appended to the browser's history stack.

#### Providing the Document Head

The code below utilizes the [React Helmet](https://github.com/nfl/react-helmet#reference-guide) library to specify the document's **head** section:

```js
import React from 'react'
import { Helmet } from 'react-helmet'

class Application extends React.Component {
  render() {
    return (
      <div className="application">
        <Helmet>
          <meta charSet="utf-8" />
          <title>My Title</title>
          <link rel="canonical" href="http://mysite.com/example" />
        </Helmet>
        ...
      </div>
    )
  }
}
```

This way, the document head is specified in an isomorphic format so it can be rendered on the server and dynamically modified on the client. Use this approach to make your reSolve applications SEO-friendly.

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

A merged module's code is treated the same as the application's code. The resulting application's bundles include the module code and configurations as if they were always a part of the application.

For an example on using modules, see the [Hacker News](https://github.com/reimagined/resolve/tree/master/examples/hacker-news) sample application. This application makes use of the authentication module and the comments module provided by reSolve.
