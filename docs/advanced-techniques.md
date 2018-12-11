---
id: advanced-techniques
title: Advanced Techniques
---

## Splitting Code Into Chunks

ReSolve uses **webpack** to transpile and bundle the application code so it can be run by client browsers, the server and serverless platforms.

ReSolve takes advantage of webpack's code splitting functionality to split the bundles into chunks. Depending on its purpose, every chunk can be server-only (for business logic), browser-only (for UI and client logic) or isomorphic (for view-models on the server side and Redux reducers on the client).

Building a reSolve application produces the following chunks:

- command processor code - aggregate command handlers and projections (server only)
- view model projection (isomorphic)
- read model projections and resolvers (server only)
- API handlers (server only)
- SSR renderer (server only, with peer dependencies with client, like `styled-components`)
- the client application with UI (browser only)

All of these chunks are used by the target application. Some chunks can be included by other chunks. E.g., the client includes the view-model projection chunk to automatically generate Redux reducers.

In a cloud/serverless environment, chunks like read-model projection & resolvers, SSR renderer, API handlers and rest business-logic are distributed to appropriate cloud executors.

When running locally, `resolve-scripts` requires all necessary chunks and combines them with the runtime code.

## Running Serverless

Coming soon. A reSolve app is serverless-ready and can be deployed into AWS with a single command.

## Server-Side Rendering

ReSolve provides the Server-Side rendering (SSR) functionality for React code out of the box. This means that reSolve application pages are always pre-rendered before being passed to the client browser. Note that server-side rendering is currently performed only for static content, without pre-fetching data.

#### Managing routes

ReSolve uses [react-router](https://github.com/ReactTraining/react-router) for routing. The [react-router-config](https://github.com/ReactTraining/react-router/tree/master/packages/react-router-config) library is also used to provide a centralized route config that can be used both on the server and client sides. You can define routes as shown below:

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

Here, each route is specified by an object whose fields correspond to the [\<Route\>](https://reacttraining.com/react-router/web/api/Route) component's props.

To register routes within a reSolve app, specify the path to the file containing routs definition in the **routes** config section:

```js
routes: 'client/routes.js'
```

After this, app routing is configured for server-side rendering. On the client, routing is also performed as expected: when you render a [\<Redirect\>](https://reacttraining.com/react-router/web/api/Redirect), the browser switches to the new location, and this location is appended to the browser's history stack.

#### Providing the document head

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

## Process Managers (Sagas)

Process Managers (or Sagas) are used to run arbitrary service code in response to events or on schedule. Generally, this is where you define logic that deal with side effects: you can emit new events and communicate with the outside world in any way (e.g., query databases, send emails, etc.). You can view a Saga as a scripted virtual user.

The code below demonstrates a Saga that handles events:

<!-- prettier-ignore-start -->

[embedmd]:# (../examples/with-saga/common/sagas/user-creation.event.js /^/ /\n$/)
```js
const eventHandlers = {
  UserCreationRequested: async (event, { resolve }) => {
    const { aggregateId } = event
    const createdUser = await resolve.executeQuery({
      modelName: 'default',
      resolverName: 'createdUser',
      resolverArgs: { id: aggregateId }
    })

    if (!createdUser) {
      return
    }

    const users = await resolve.executeQuery({
      modelName: 'default',
      resolverName: 'users',
      resolverArgs: { id: aggregateId }
    })

    const userWithSameEmail = users.find(
      user => user.email === createdUser.email
    )

    await resolve.executeCommand({
      type: userWithSameEmail ? 'rejectUserCreation' : 'confirmUserCreation',
      aggregateName: 'user',
      payload: { createdUser },
      aggregateId
    })
  }
}

export default eventHandlers
```

<!-- prettier-ignore-end -->

For a scheduled Saga, tasks are specified in the cron format. The code below demonstrates a Saga that emits commands on schedule:

<!-- prettier-ignore-start -->

[embedmd]:# (../examples/with-saga/common/sagas/user-creation.cron.js /^/ /\n$/)
```js
const outdatedPeriod = 1000 * 60 * 10

const cronHandlers = {
  '0 */10 * * * *': async ({ resolve }) => {
    const users = await resolve.executeQuery({
      modelName: 'default',
      resolverName: 'users'
    })

    const now = Date.now()

    users.forEach(user => {
      if (user.timestamp + outdatedPeriod < now) {
        resolve.executeCommand({
          type: 'deleteOutdatedUser',
          aggregateName: 'user',
          aggregateId: user.id
        })
      }
    })
  }
}

export default cronHandlers
```

<!-- prettier-ignore-end -->

For the full code, refer to the [With Saga](https://github.com/reimagined/resolve/tree/dev/examples/with-saga) example project.

## Adapters

ReSolve uses the **adapter** mechanism to provide an abstraction layer above APIs used by its subsystems. For instance, adapters are used to define how a reSolve application stores its data. They abstract away all direct interactions with the underlying storage, allowing reSolve to provide a unified data management API.

ReSolve uses different types of adapters depending on which kind of data needs to be stored.

- **Event store adapters**
- **Snapshot store adapters**
- **Read model store adapters**

Resolve comes with a set of adapters covering popular DBMS choices. You can also implement new adapters to store data in any required way.

Note that reSolve does not force you to use adapters. For example, you may need to implement a Read Model on top of some arbitrary system, such as a full-text-search engine, OLAP or a particular SQL database. In such case, you can just work with that system in the code of the projection function and query resolver, without writing a new Read Model adapter.

To learn more about a particular adapter type, refer to the documentation for the reSolve **[adapters](https://github.com/reimagined/resolve/tree/master/packages/adapters)** package.

# Modules

In reSolve, a module encapsulates a fragment of functionality that can be included by an application. A module can encapsulate any structural parts of a reSolve application in any combination.

Physically, a module is a standalone configuration object that can reference client code, read-side and write-side code, sagas and HTTP queries. To include a module into your application, you need to initialize this object with any required additional settings and merge it into your application's centralized config:

```js
...
const moduleAuth = resolveModuleAuth([
  {
    name: 'local-strategy',
    createStrategy: 'auth/create_strategy.js',
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
      },
      {
        path: 'logout',
        method: 'POST',
        callback: 'auth/route_logout_callback.js'
      }
    ]
  }
])

const baseConfig = merge(
  defaultResolveConfig,
  appConfig,
  moduleAuth,
  ...
)
```

A merged module's code is treated the same as the application's code. The resulting application's bundles include the module code and configurations as if they were always a part of the application.

For an example on using modules, see the [Hacker News](../examples/hacker-news) sample application. This application makes use of the [authentication module](../packages/modules/resolve-module-auth) as well as the [comments module](../packages/modules/resolve-module-comments) provided with reSolve.
