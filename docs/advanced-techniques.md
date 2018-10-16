# Splitting Code Into Chunks

reSolve uses webpack to transpile and bundle application code, so it can be run by browsers, server and serverless platforms. 

[TODO] fix and elaborate what goes where.

Every chunk is used for building target application. Some chunks are being included by different chunk, for example, client includes view-model projection chunk for automatic redux-reducers generation.
When executing in cloud/serverless, chunks like read-model projection & resolvers, SSR renderer, API hadnlers and rest business-logic are distributet to apropriate cloud executors.
When executing locally, `resolve-scripts` requires all nessesary chunks and combines them with runtime code.
Depend on usage, every chunk can be server-only (for business logic), browser-only (for UI and client logic) and isomorphic (for view-models, which automatically maps to redux reducers).
So, After building, reSolve application code is bundled into following chanks:

- command processor code - aggregate command handlers and projections (server only)
- view model projection (isomorphic)
- read model projections and resolvers (server only)
- API handlers (server only)
- SSR renderer (server only, with peer dependencies with client, like `styled-components`)
- client application with UI (browser only)

[Comments ontopic]
Resolve 

# Running Serverless

Coming soon. reSolve app is serverless-ready and can be deployed into AWS with a single command.

# Server-Side Rendering

[TODO] add details of how SSR works

A route configuration is basically a set of instructions that tell a router how to try to match the URL and what code to run when it does. You declare your routes as part of your app’s in the config section `.routes` [default: `routes.js`]

The Resolve uses [react-router](https://github.com/ReactTraining/react-router) and [react-router-config](https://github.com/ReactTraining/react-router/tree/master/packages/react-router-config).

#### Route Configuration Shape
https://github.com/reacttraining/react-router/tree/master/packages/react-router-config#route-configuration-shape

Routes are objects with the same properties as a [<Route>](https://reacttraining.com/react-router/web/api/Route):

```js
const routes = [
  { component: Root,
    routes: [
      { path: '/',
        exact: true,
        component: Home
      },
      { path: '/child/:id',
        component: Child,
        routes: [
          { path: '/child/:id/grand-child',
            component: GrandChild
          }
        ]
      }
    ]
  }
]
```

When you render a [<Redirect>](https://reacttraining.com/react-router/web/api/Redirect) history changes state and we get the new screen.

#### Customization document head
This reusable React component will manage all of your changes to the document head. [React Helmet](https://github.com/nfl/react-helmet#reference-guide).

```js
import React from "react";
import { Helmet } from "react-helmet";

class Application extends React.Component {
  render () {
    return (
        <div className="application">
            <Helmet>
                <meta charSet="utf-8" />
                <title>My Title</title>
                <link rel="canonical" href="http://mysite.com/example" />
            </Helmet>
            ...
        </div>
    );
  }
};
```

# Process Managers (Sagas)

Process Managers (or Sagas) are used to run arbitrary service code in response to events or on schedule. Generally, this is where you define logic that deal with side effects: you can emit new events and communicate with the outside world in any way (e.g., query databases, send emails, etc.). You can view a Saga as a scripted replacement to a user.

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

# Adapters

ReSolve uses the **adapter** mechanism to provide an abstraction layer above APIs used by its subsystems. For instance, adapters are used to define how a reSolve application stores its data. They abstract away all direct interactions with the storage, allowing reSolve to provide a unified data management API.

ReSolve uses different types of adapters depending on which kind of data needs to be stored.

- **Event store adapters**
- **Snapshot store adapters**
- **Read model store adapters**

Resolve comes with a set of adapters that cover popular DBMS choices. You can also implement new adapters to store data in any required way.

Note that reSolve does not force you to use adapters. For instance, you may need to build a Read Model on top of some arbitrary system, such as a full-text-search engine, OLAP or a specific SQL database. In such case you can just work with that system in the code of the projection function and query resolver, without writing a new Read Model adapter.

To learn more about a particular adapter type, refer to the documentation for [reSolve adapter modules](https://github.com/reimagined/resolve/tree/master/packages/adapters).
