# Splitting Code Into Chunks

# Running Serverless

# Server-Side Rendering

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

# Custom Adapters

[TODO] Don't use word "custom" - it implies that there are "normal" adapters.
It is just that reSolve comes with number of adapters and other can be written.

[TODO] Also, I'm not sure we need to describe it in the main docs - maybe just leave a reference to adapters folder and
leave some info there.

## Event store adapter

You can implement a custom adapter according to your requirements.

An event storage adapter implementation should expose the following methods:

| Method Signature                                              | Description                                  |
| ------------------------------------------------------------- | -------------------------------------------- |
| saveEvent(event)                                              | Saves event to the store.                    |
| loadEventsByTypes: (types, callback, startTime)               | Gets events of the specified types.          |
| loadEventsByAggregateIds: (aggregateIds, callback, startTime) | Gets events with the specified aggregate IDs |

By default, events are stored in a **event-storage.db** file in the application's root folder.

In a development environment you can reset the state of the system by removing the event store file/database.

[TODO] This is not what event store is doing "by default". In the reSolve template, in "dev" environment we are using simple in-memory event store
(based on nedb?) that is using event-storage.db file to save events. You can configure a different adapter for "dev" and it will use something else.

# Snapshot store adapter

[TODO] We need to describe snapshot store api too

# Read model store

reSolve comes with abstract read-model storage API and several adapters. This allows you to abstract your projection and resolver function code from specific dbms.

But if you need to use some other system for your read model, such as full-text-search engine, OLAP or specific SQL database - you don't need to write a new adapter, you can just work with that system in the code of projection function and query resolver.

You can even bypass query resolver, if your read model storage system provides its own query interface.
