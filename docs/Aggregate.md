# Aggregate

## What is an Aggregate?

An **Aggregate** is a cluster of domain objects responsible for system behavior. **Aggregates** encapsulate business logic used to manage the application **State**.

### How to Change the System State?

In a **CQRS** + **Event Sourcing** system, the **State** changes as a result of the following chain:

1. A user issues a **Command** using an application interface.
2. A [**Domain Aggregate**](./System%20Metaphor.md) receives the **Command**.
3. The **Domain Aggregate** handles the **Command**: checks whether it can be executed and generates an **Event**.
4. The **Event** is sent to the [**Event Store**](./Event%20Store.md).
5. The **State** changes.

Refer to the [Edument CQRS Starter Kit Tutorial](http://cqrs.nu/tutorial/cs/01-design) for details.


## How to Use?

reSolve stores **Aggregates** in the `common/aggregates/` folder. A typical **Aggregate** consists of two parts: **Commands** and a **Projection**. In **reSolve**:

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

A typical **Commands** structure:

```js
export default {
  createStory: (state, command) => {
    const { title, link, text } = command.payload

    return {
      type: 'StoryCreated',
      payload: { title, text, link, userId, userName }
    }
  }
  // ...
}
```

A typical **Projection** structure:

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
  // ...
}
```

## What's Next?

📑 Available scripts, project structure overview, configuration files and much other useful information are in the [**API References**](https://github.com/reimagined/resolve/blob/master/docs/API%20References.md) topic.

📑 To learn more about common building principles of architecture, please look at the [**Architecture**](https://github.com/reimagined/resolve/blob/master/docs/Architecture.md) documentation topic.

📑 Learn more about [**Command**](././Command.md) and [**Event Store**](./Event%20Store.md).

![Analytics](https://ga-beacon.appspot.com/UA-118635726-1/docs-aggregate?pixel)
