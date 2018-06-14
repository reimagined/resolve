# Aggregate

## What is an Aggregate?

An **Aggregate** is responsible for a system's behavior and encapsulates business logic. It responses to commands, checks whether they can be executed and generates events to change a system's current status.

When you need to change the system's state, you send a [**Command**](./Command.md). A command is addressed to a [**Domain Aggregate**](./System%20Metaphor.md). An **Aggregate** is a cluster of logically related objects, containing enough information to perform a command as one transaction. It handles a command, checks whether it can be executed and generates an event to change the system's state. A new event is sent to [**Event Store**](./Event%20Store.md). 

Refer to [DDD_Aggregates](https://martinfowler.com/bliki/DDD_Aggregate.html) or [DDD, Event Sourcing, and CQRS Tutorial: design](http://cqrs.nu/tutorial/cs/01-design) for more information on aggregates.

## How to Use?

Usually, an Aggregate is described for reSolve application in `commmon/aggregates/index.js` file. You can have any aggregates as you need for application:

```
📁 resolve-app
    ...
    📁 common
        ...
        📁 aggregates
            📄 aggregate1.js
            📄 aggregate2.js
            📄 aggregate3.js
            ...
```

A typical an Aggregate structure:

```js
export default [
  {
    name: 'Todo',
    commands: {
      createItem: (state, { payload: { id, text } }) => ({
        type: 'ITEM_CREATED',
        payload: { id, text }
      }),
      toggleItem: (state, { payload: { id } }) => ({
        type: 'ITEM_TOGGLED',
        payload: { id }
      }),
      removeItem: (state, { payload: { id } }) => ({
        type: 'ITEM_REMOVED',
        payload: { id }
      })
    }
  }
]
```

## What's Next?

📑 Available scripts, project structure overview, configuration files and much other useful information are in [**API References**](https://github.com/reimagined/resolve/blob/master/docs/API%20References.md) topic.

📑 To learn more about common building principles of architecture, please look at [**Architecture**](https://github.com/reimagined/resolve/blob/master/docs/Architecture.md) documentation topic.

📑 Learn more about [**Command**](././Command.md) and [**Event Store**](./Event%20Store.md).

![Analytics](https://ga-beacon.appspot.com/UA-118635726-1/docs-aggregate?pixel)