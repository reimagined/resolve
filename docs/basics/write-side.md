# Configuring Commands and Events
The main purpose of the write side is to receive commands and translate them to events, which a then saved to the event store. This document section provides information on how you can control this functionality.

To get basic understanding on the concept refer to popular publications on the Event Sourcing paradigm.

Commands are processed according to logic defined by the aggregate.

In reSolve, and aggregate consists of the following building blocks
* **Commands** - A set of function that map commands along with arbitrary data payload and map them tho corresponding events, which are then saved to the event store. Refer to the [Command Handler](#command-handler) section to learn more.


* **Projection** - A set of functions used to accumulate state for particular commands on the read side. You can then use this state in **commands**, e.g., to perform validation. Refer to the [Aggregate Projection Function](#aggregate-projection-function) section to learn more.


# Sending a Command
You can emit a command in the following use-case scenarios: 
* [Sending commands from the client](#sending-commands-from-the-client) 
* [Sending commands from the server](#emitting-commands-on-the-server)

### Sending Commands From the Client 
The reSolve framework exposes a standard REST API interface that you can use to to send commands from the client side. Depending on the architecture of your web application's front-end, you can use this API interface directly or using the **Redux** bindings provided by the **[resolve-redux](https://github.com/reimagined/resolve/tree/master/packages/core/resolve-redux)** library.

You can send a command from the client side by sending a POST request to the following URL:
```
http://{host}:{port}/api/commands
```
The request body should have the `application/json` content type and the following structure:

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
curl -X POST -H "Content-Type: application/json" \
-d "{\"aggregateName\":\"Todo\", \"type\":\"createItem\", \"aggregateId\":\"root-id\", \"payload\": {\"id\":`date +%s`, \"text\":\"Learn reSolve API\"}}" \
"http://localhost:3000/api/commands"
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




# Command Handler


The aggregate Commands object maps associates command handlers with command names. A command handler receives a state accumulated by the aggregate [Projection](#aggregate-projection-function) the command object. The command object has the following structure:


A command handler should return an event object that is then saved to the [event store](#event-store). An event object consists of the name and an arbitrary **payload**. 

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
A projection function on write side is used to accumulate an arbitrary state based on commands received by the aggregate. A projection function receives a state and command data. Based on received data, a projection function returns an updated state. The accumulated state is passed to the corresponding [command handler](#command_handler). 

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
All events returned by command handlers are saved to the event store. The saving is performed by the reSolve framework using one of the supported storage adapters or you can implement a custom adapter according to your requirements. 

An event storage adapter implementation should expose the following methods:

| Method Signature                                                  | Description                                    |
| ----------------------------------------------------------------- | ---------------------------------------------- |
| saveEvent(event)                                                  | Saves event to the store.                      |
| loadEventsByTypes: (types, callback, startTime)                   | Gets events of the specified types.            |
| loadEventsByAggregateIds: (aggregateIds, callback, startTime)     | Gets events with the specified aggregate IDs   |


By default, events are stored in a **event-storage.db** file in the application's root folder.

In a development environment you can reset the state of the system by removing the event store file/database.