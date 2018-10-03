# Aggregates
Commands are executed by objects that encapsulate domain logic. These objects are called Domain Objects. Usually Domain Objects are grouped into Aggregates. Aggregate boundary should be a transaction boundary. In CQRS/ES app it means that given aggregate should be able to execute a command without talking to other aggregates.

Since write side is used only to perform commands, your aggregate can be pretty slim, and only keep state that required for command exection.

See Martin Fowler's definition for aggregates in the DDD paradigm: [https://martinfowler.com/bliki/DDD_Aggregate.html](https://martinfowler.com/bliki/DDD_Aggregate.html)


In reSolve aggregate is a static object that contains set of functions. Functions that build aggregate state from events are called [projections](#aggregate-projection-function). Functions that executes commands - [command handlers](#command-handler). Aggregate state is passed to each of these functions explicitly as parameter.


# Configuring Aggregates
To configure an aggregates in reSolve app, provide aggregates array in the application configuration file:

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

# Sending a Command
You can emit a command in the following use-case scenarios: 
* [Sending commands from the client](#sending-commands-from-the-client) 
* [Sending commands from the server](#emitting-commands-on-the-server)

### Sending Commands From the Client 
The reSolve framework exposes [HTTP API](../api-reference.md#commands-http-api) that you can use to to send commands from the client side. Depending on the architecture of your web application's front-end, you can use this API interface directly or using the **Redux** bindings provided by the **[resolve-redux](https://github.com/reimagined/resolve/tree/master/packages/core/resolve-redux)** library.

You can send a command from the client side by sending a POST request to the following URL:
```
http://{host}:{port}/api/commands
```
The request body should have the `application/json` content type and the following structure:

[TODO] - this is a description of command object, not a request body format. Request body should be simply a JSON representation of a command, whatever it is.

``` js
{
  "aggregateName": aggregateName,
  "type": commandType,
  "aggregateId": aggregateID,
  "payload": {
    param1: value1,
    param2: value2,
    // ...
    paramN: valueN
  }
}
```

|        Name       |  Type  | Description
| ----------------- | ------ | ------------
| **aggregateId**   | string | The ID of an aggregate to which you are addressing the command
| **aggregateName** | string | The aggregate's name as defined in [config.app.js](../examples/shopping-list/config.app.js)
| **commandType**   | string | The command type supported by [the aggregate](../examples/shopping-list/common/aggregates)
| **payload**       | object | The parameters that [the command](../examples/shopping-list/common/aggregates) accepts

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

``` js
await resolve.executeCommand({
  type: userWithSameEmail ? 'rejectUserCreation' : 'confirmUserCreation',
  aggregateName: 'user',
  payload: { createdUser },
  aggregateId
})
```

For the full code sample, refer to the [with-saga](https://github.com/reimagined/resolve/tree/master/examples/with-saga) example project.


# Aggregate Command Handlers


The aggregate command handlers object maps associates command handlers with command names. A command handler receives a state accumulated by the aggregate [Projection](#aggregate-projection-function) the command object. The command object has the following structure:


A command handler should return an event object that is then saved to the [event store](#event-store). A returned object should specify an event type and some **payload** specific to this event type. 

A typical **Commands** object structure:

``` js
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
Projection function is used to calculate an aggregate state based on agreggate's events. A projection function receives a previous state and event to be applied. Based on input, a projection function should return a new state. The computed state is then passed to the corresponding [command handler](#command_handler). 

Init function returns initial state of the aggregate.

 A typical **Projection** object structure: 

``` js
export default {
  Init: () => ({}),
  'StoryCreated': (state, { timestamp, payload: { userId } }) => ({
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

[TODO] This should go to the advanced section, not to basics

All events returned by command handlers are saved to the event store. The saving is performed by the reSolve framework using one of the supported storage adapters or you can implement a custom adapter according to your requirements. 

An event storage adapter implementation should expose the following methods:

| Method Signature                                                  | Description                                    |
| ----------------------------------------------------------------- | ---------------------------------------------- |
| saveEvent(event)                                                  | Saves event to the store.                      |
| loadEventsByTypes: (types, callback, startTime)                   | Gets events of the specified types.            |
| loadEventsByAggregateIds: (aggregateIds, callback, startTime)     | Gets events with the specified aggregate IDs   |


By default, events are stored in a **event-storage.db** file in the application's root folder. 

In a development environment you can reset the state of the system by removing the event store file/database.
