# Aggregate

## What is an Aggregate?

An **Aggregate** is responsible for a system's behavior and encapsulates business logic. It responses to commands, checks whether they can be executed and generates events to change a system's current status.

When you need to change the system's state, you send a [**Command**](./Command.md). A command is addressed to a [**Domain Aggregate**](./System%20Metaphor.md). An **Aggregate** is a cluster of logically related objects, containing enough information to perform a command as one transaction. It handles a command, checks whether it can be executed and generates an event to change the system's state. A new event is sent to [**Event Store**](./Event%20Store.md). 

Refer to [DDD_Aggregates](https://martinfowler.com/bliki/DDD_Aggregate.html) or [DDD, Event Sourcing, and CQRS Tutorial: design](http://cqrs.nu/Faq#what-is-an-aggregate) for more information on aggregates.

## How to Use?

Usually, an Aggregate contains two parts: a **Command** and a state model that we can call a **Projection**. They are described for reSolve application in `commmon/aggregates/` folder. You can have any aggregates, commands and projections as you need for application:

```
📁 resolve-app
    ...
    📁 common
        ...
        📁 aggregates
            📄 aggregate1.commands.js
            📄 aggregate1.projection.js
            📄 aggregate2.commands.js
            📄 aggregate2.projection.js
            ...
```

A typical a **Command** structure:

```js
export default {
  createStory: (state, command) => {
    const { title, link, text } = command.payload

    return {
      type: 'StoryCreated',
      payload: { title, text, link, userId, userName }
    }
  }
}
```

A typical a **Projection** structure:

```js
export default {
  Init: () => ({}),
  'StoryCreated': (state, { timestamp, payload: { userId } }) => ({
    ...state,
    createdAt: timestamp,
    createdBy: userId,
    voted: [],
    comments: {}
  })
}
```

## What's Next?

📑 Available scripts, project structure overview, configuration files and much other useful information are in [**API References**](https://github.com/reimagined/resolve/blob/master/docs/API%20References.md) topic.

📑 To learn more about common building principles of architecture, please look at [**Architecture**](https://github.com/reimagined/resolve/blob/master/docs/Architecture.md) documentation topic.

📑 Learn more about [**Command**](././Command.md) and [**Event Store**](./Event%20Store.md).

![Analytics](https://ga-beacon.appspot.com/UA-118635726-1/docs-aggregate?pixel)