# Aggregates
DDD Aggregates - [Martin Fowler's definition](https://martinfowler.com/bliki/DDD_Aggregate.html)

In reSolve aggregate is an object that contains set of functions. Functions that build aggregate state from events are called projections. Functions that executes commands - command handlers.
# Configuring Aggregates
To configure an aggregates in reSolve app, provide `aggregates` array in the application configuration file:

[embedmd]:# (../../examples/shopping-list/config.app.js /aggregates: \[/ /\]/)
```js
aggregates: [
    {
      name: 'ShoppingList',
      commands: 'common/aggregates/shoppingList.commands.js',
      projection: 'common/aggregates/shoppingList.projection.js'
    }
  ]
```

# Sending a Command
# Command Handler
# Aggregate Projection Function

# Event Store
