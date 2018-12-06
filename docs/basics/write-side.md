# Aggregates

Commands are executed by objects that encapsulate domain logic. These objects are called Domain Objects.
Usually Domain Objects are grouped into Aggregates. Aggregate boundary should be a transaction boundary.
In a CQRS/ES app, it means that any given aggregate should be able to execute its commands without talking to other aggregates.

Since the write side is used only to perform commands, your aggregate can be pretty slim, and only keep state that required for command execution.

See Martin Fowler's definition for aggregates in the DDD paradigm: [https://martinfowler.com/bliki/DDD_Aggregate.html](https://martinfowler.com/bliki/DDD_Aggregate.html)

In reSolve, an aggregate is a static object that contains a set of functions. Functions that build aggregate
state from events are called [projections](#aggregate-projection-function).
Functions that execute commands - [command handlers](#command-handler).
Aggregate state is passed to each of these functions explicitly as an argument.

# Aggregate ID

Each aggregate should have a unique ID that is immutable during its lifetime. An Aggregate ID should be unique in the given event store, however we recommend to also keep it
globally unique. We recommend generating Aggregate IDs using [UUID v4](https://github.com/kelektiv/node-uuid#version-4) or [cuid](https://github.com/ericelliott/cuid) for distributed scalable apps.

Please note that you have to generate a new Aggregate ID and send it with a command that creates a new aggregate.

# Configuring Aggregates

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

# Sending a Command

You can emit a command in the following use-case scenarios:

- [Sending commands from the client](#sending-commands-from-the-client)
- [Emitting commands on the server](#emitting-commands-on-the-server)

### Sending Commands From the Client

The reSolve framework exposes [HTTP API](../api-reference.md#commands-http-api) that you can use to to send commands from the client side. Depending on the architecture of your web application's front-end, you can use this API interface directly or using the **Redux** bindings provided by the **[resolve-redux](https://github.com/reimagined/resolve/tree/master/packages/core/resolve-redux)** library.

You can send a command from the client side by sending a POST request to the following URL:

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

| Name              | Type   | Description                                                                                 |
| ----------------- | ------ | ------------------------------------------------------------------------------------------- |
| **aggregateId**   | string | The ID of an aggregate to which you are addressing the command                              |
| **aggregateName** | string | The aggregate's name as defined in [config.app.js](../examples/shopping-list/config.app.js) |
| **commandType**   | string | The command type supported by [the aggregate](../examples/shopping-list/common/aggregates)  |
| **payload**       | object | The parameters that [the command](../examples/shopping-list/common/aggregates) accepts      |

##### Example

Use the following command to add an item to the [shopping-list example](../examples/shopping-list).

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

You can emit a command on the server side from a **Saga** or **API Handler** using the **resolve.executeCommand** function as shown below:

```js
await resolve.executeCommand({
  type: userWithSameEmail ? 'rejectUserCreation' : 'confirmUserCreation',
  aggregateName: 'user',
  payload: { createdUser },
  aggregateId
})
```

For the full code sample, refer to the [with-saga](https://github.com/reimagined/resolve/tree/master/examples/with-saga) example project.

# Aggregate Command Handlers

The aggregate command handlers object associates command handlers with command names. A command handler receives a state accumulated by the aggregate [Projection](#aggregate-projection-function).

A command handler should return an event object that is then saved to the [event store](#event-store). A returned object should specify an event type and some **payload** specific to this event type.

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

# Aggregate Projection Function

Projection functions are used to calculate an aggregate state based on the agreggate's events. A projection function receives a previous state and event to be applied. A projection function should return a new state based on the input. The computed state is then passed to the corresponding [command handler](#command_handler).

The Init function returns initial state of the aggregate.

A typical **Projection** object structure:

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
  // ...
}
```

# Event Store

All events returned by command handlers are saved to the event store. The saving is performed by the reSolve framework using one of the supported storage adapters.

You can specify the storage adapter in the **storageAdapter** config section:

```js
storageAdapter: {
  module: 'resolve-storage-lite',
  options: {
    pathToFile = '../event-storage.db'
  }
}
```

Adapters for the following storage types are available out of the box:

- [File or memory](https://github.com/reimagined/resolve/tree/master/packages/adapters/storage-adapters/resolve-storage-lite)
- [MongoDB](https://github.com/reimagined/resolve/tree/master/packages/adapters/storage-adapters/resolve-storage-mongo)
- [MySQL](https://github.com/reimagined/resolve/tree/master/packages/adapters/storage-adapters/resolve-storage-mysql)

To learn more about adapters, refer to the [Adapters](../advanced-techniques.md#adapters) section of the reSolve documentation.
