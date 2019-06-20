---
id: write-side
title: Write Side
---

## Aggregates

Commands are executed by objects that encapsulate domain logic. These objects are called Domain Objects.
Domain Objects are grouped into Aggregates. In a CQRS/ES app, an aggregate is a transaction boundary. This means that any given aggregate should be able to execute its commands without communicating with other aggregates.

Since the write side is used only to perform commands, your aggregate can be compact, and only keep state required for command execution.

See Martin Fowler's definition for aggregates in the DDD paradigm: [https://martinfowler.com/bliki/DDD_Aggregate.html](https://martinfowler.com/bliki/DDD_Aggregate.html)

In reSolve, an aggregate is a static object that contains a set of functions of the following two kinds:

- [Projections](#aggregate-projection-function) - build aggregate state base from events.
- [Command Handlers](#aggregate-command-handlers) - execute commands.

Aggregate state is explicitly passed to all of these functions as an argument.

## Aggregate ID

Each aggregate should have a unique ID that is immutable during the aggregate's lifetime. An Aggregate ID should stay unique in the given event store, however we also recommend to keep it
globally unique. We recommend that you use [UUID v4](https://github.com/kelektiv/node-uuid#version-4) or [cuid](https://github.com/ericelliott/cuid) to generate aggregate IDs for scalable apps.

Note that you have to generate a new Aggregate ID and send it with a command that creates a new aggregate.

## Configuring Aggregates

To configure aggregates in a reSolve app, provide an aggregates array in the application configuration file:

<!-- prettier-ignore-start -->

[embedmd]:# (../../examples/shopping-list/config.app.js /aggregates: \[/ /\]/)
```js
aggregates: [
    {
      name: 'ShoppingList',
      commands: 'common/aggregates/shopping_list.commands.js',
      projection: 'common/aggregates/shopping_list.projection.js'
    }
  ]
```

<!-- prettier-ignore-end -->

## Sending a Command

You can emit aggregate commands in the following cases:

- [Sending commands from the client](#sending-commands-from-the-client)
- [Emitting commands on the server](#emitting-commands-on-the-server)

### Sending Commands From the Client

The reSolve framework exposes an [HTTP API](api-reference.md#commands-http-api) that you can use to to send commands from the client side. Your application's frontend can use this API directly or through the **Redux** binding mechanism from the **[resolve-redux](https://github.com/reimagined/resolve/tree/master/packages/core/resolve-redux)** library.

You can send a command from the client side as a POST request to the following URL:

```
http://{host}:{port}/api/commands
```

The request body should have the `application/json` content type and contain a JSON representation of the command:

```
{
  "aggregateName": aggregateName,
  "type": commandType,
  "aggregateId": aggregateID,
  "payload": {
    "param1": value1,
    "param2": value2,
    ...
    "paramN": valueN
  }
}
```

| Name              | Type   | Description                                           |
| ----------------- | ------ | ----------------------------------------------------- |
| **aggregateId**   | string | The ID of an aggregate that should handle the command |
| **aggregateName** | string | The aggregate's name as defined in **config.app.js**  |
| **commandType**   | string | The command type that the aggregate can handle        |
| **payload**       | object | The parameters that the command accepts               |

##### Example

Use the following command to add an item to the **shopping-list** example:

```sh
$ curl -X POST "http://localhost:3000/api/commands"
--header "Content-Type: application/json" \
--data '
{
  "aggregateName":"Todo",
  "type":"createItem",
  "aggregateId":"root-id",
  "payload": {
    "id":`date +%s`,
    "text":"Learn reSolve API"
  }
}
'
```

### Emitting Commands on the Server

You can use the **resolve.executeCommand** function to emit a command on the server side from a **[Saga](advanced-techniques.md#process-managers-sagas)** or **[API Handler](api-handlers.md)**:

```js
await resolve.executeCommand({
  type: userWithSameEmail ? 'rejectUserCreation' : 'confirmUserCreation',
  aggregateName: 'user',
  payload: { createdUser },
  aggregateId
})
```

For the full code sample, refer to the [with-saga](https://github.com/reimagined/resolve/tree/master/examples/with-saga) example project.

## Aggregate Command Handlers

Aggregate command handlers are grouped into a static object. A command handler receives a command and a state object built by the aggregate [Projection](#aggregate-projection-function). The command handler should return an event object that is then saved to the [event store](#event-store). A returned object should specify an event type and a **payload** specific to this event type.

A typical **Commands** object structure:

```js
export default {
  // A command handler
  createStory: (state, command) => {
    const { title, link, text } = command.payload
    // The resulting event object
    return {
      type: 'StoryCreated',
      payload: { title, text, link, userId, userName }
    }
  }
  // ...
}
```

## Aggregate Projection Function

Projection functions are used to calculate an aggregate state based on the aggregate's events. A projection function receives the previous state and an event to be applied. It should return a new state based on the input.

Projection functions run for all events with the current aggregate ID. The resulting state is then passed to the corresponding [command handler](#aggregate-command-handlers).

In addition to projection functions, a projection object should define an **Init** function. This function returns the initial state of the aggregate.

A typical projection object structure is shown below:

```js
export default {
  Init: () => ({}),
  StoryCreated: (state, { timestamp, payload: { userId } }) => ({
    ...state,
    createdAt: timestamp,
    createdBy: userId,
    voted: [],
    comments: {}
  })
  ...
}
```

## Event Store

All events returned by command handlers are saved to the event store. The reSolve framework uses one of the supported storage adapters to write events to the storage.

You can specify the storage adapter in the **storageAdapter** config section:

```js
storageAdapter: {
  module: 'resolve-storage-lite',
  options: {
    databaseFile: '../data/event-store.db'
  }
}
```

Adapters for the following storage types are available out of the box:

- [File or memory](https://github.com/reimagined/resolve/tree/master/packages/adapters/storage-adapters/resolve-storage-lite)
- [MongoDB](https://github.com/reimagined/resolve/tree/master/packages/adapters/storage-adapters/resolve-storage-mongo)
- [MySQL](https://github.com/reimagined/resolve/tree/master/packages/adapters/storage-adapters/resolve-storage-mysql)

You can also add your own storage adapter to store events.
Refer to the [Adapters](advanced-techniques.md#adapters) section of the reSolve documentation for more information about adapters.
