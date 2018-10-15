# Splitting Code Into Chunks

reSolve uses webpack to transpile and bundle application code, so it can be run by browsers, server and serverless platforms. After building, reSolve application code is bundled into following chanks:

[TODO] fix and elaborate what goes where.

- command processor code (aggregate command handlers and projections)
- view model query resolvers
- read model projections
- read model query resolvers
- API handlers
- SSR renderer
- client vendor libraries
- client app

# Running Serverless

Coming soon. reSolve app is serverless-ready and can be deployed into AWS with a single command.

# Server-Side Rendering

[TODO] add details of how SSR works

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
