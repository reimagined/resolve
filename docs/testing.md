---
id: testing
title: Testing
---

## Testing Tools

The **@resolve-js/testing-tools** package contains utilities that allow you write BDD-style tests for reSolve aggregates, read models and sagas. The provided tools reproduce a read model's full lifecycle in the testing environment.

To write a test, call the `givenEvents` function. This function takes an array of events and gives access to a number of chainable functions and assertions that you can combine to describe a test case.

## Testing Aggregates

Use the `.aggregate` function to add an aggregate to a test case. Use the following API to describe the test case for an aggregate:

### Chainable Functions

| Function                      | Description                                         |
| ----------------------------- | --------------------------------------------------- |
| `as(jwt)`                     | Specifies a JSON Web Token used for authentication. |
| `command(name, payload?)`     | Specifies a command to pass to the Aggregate.       |
| `withSecretsManager(manager)` | Assigns a secrets manager to the aggregate          |

### Assertions

| Assertion                   | Description                                                          |
| --------------------------- | -------------------------------------------------------------------- |
| `shouldProduceEvent(event)` | Succeeds if the specified event was produced in the given test case. |
| `shouldThrow(error)`        | Succeeds if the Aggregate throws an exception.                       |

The code sample below demonstrates a **jest** test for an Aggregate:

```js
test('expecting success command execution', () =>
  givenEvents([])
    .aggregate(aggregate)
    .command('create', {})
    .as('valid-user')
    .shouldProduceEvent({
      type: 'TEST_COMMAND_EXECUTED',
      payload: {},
    }))
```

The `aggregate` function's parameter should be an object with the following fields:

| Field                    | Description                         |
| ------------------------ | ----------------------------------- |
| `name`                   | The Aggregate's name.               |
| `projection`             | The projection definition.          |
| `commands`               | The definition of command handlers. |
| `encryption`_(optional)_ | An encryption factory function.     |

## Testing Read Models

Use the `.readModel` function to add a read model to a test case. Use the following API to describe a test case for a read model:

### Chainable Functions

| Function                      | Description                                         |
| ----------------------------- | --------------------------------------------------- |
| `as(jwt)`                     | Specifies a JSON Web Token used for authentication. |
| `not()`                       | Invers the assertions.                              |
| `query(resolver, args?)`      | Specifies a query to send to the read model.        |
| `withAdapter(adapter)`        | Specifies a read model adapter to use.              |
| `withEncryption(encryption)`  | Specifies an encryption factory function to use.    |
| `withSecretsManager(manager)` | Assigns a secrets manager to the aggregate          |

### Assertions

| Assertion                      | Description                                                                     |
| ------------------------------ | ------------------------------------------------------------------------------- |
| `shouldReturn(expectedResult)` | Specifies the result that should be return by a query defined in the test case. |

The code sample below demonstrates a **jest** test for a read model:

```js
test('shouldReturn assertion', async () => {
  await givenEvents([
    { aggregateId: 'id2', type: 'TEST2', payload: { name: 'test-name' } },
  ])
    .readModel(readModel)
    .query('get', { id: 2 })
    .shouldReturn({ name: 'test-name' })
})
```

In this example, the `.all` function called at the end of the call chain is the `ShoppingLists` read model's resolver function. It returns a promise that resolves to the resolver's response object.

## Testing Sagas

Use the `.saga` function to add a saga to a test case. Use the following API to describe a test case for a saga:

### Chainable Functions

| Function                                                           | Description                                                          |
| ------------------------------------------------------------------ | -------------------------------------------------------------------- |
| `allowSideEffects()`                                               | Specifies that saga side effects are allowed.                        |
| `startSideEffectsFrom(date)`                                       | Specifies the date time from which to start to execute side effects. |
| `withAdapter(adapter)`                                             | Specifies a read model adapter to use.                               |
| `withEncryption(encryption)`                                       | Specifies an encryption factory function to use.                     |
| `withSecretsManager(manager)`                                      | Assigns a secrets manager to the aggregate                           |
| `mockCommandImplementation(aggregateName, type, implementation)`   | Specifies a mock function to be called with the saga's commands.     |
| `mockQueryImplementation(modelName, resolverName, implementation)` | Specifies a mock function to be called with the saga's queries.      |

### Assertions

| Assertion                                | Description                                                                                 |
| ---------------------------------------- | ------------------------------------------------------------------------------------------- |
| `shouldExecuteCommand(command)`          | Succeeds if the saga executes the specified command.                                        |
| `shouldExecuteQuery(query)`              | Succeeds if the saga executes the specified query.                                          |
| `shouldExecuteSideEffect(name, ...args)` | Succeeds if the saga calls the specified side effect function with the specified arguments. |

The code sample below demonstrates a **jest** test for a saga:

```js
test('shouldExecuteSideEffect & shouldExecuteCommand', async () => {
  await givenEvents([
    {
      type: 'CommandSideEffect',
      aggregateId: 'aggregate-id',
    },
  ])
    .saga(saga)
    .shouldExecuteSideEffect('email', 'test', 'aggregate-id')
    .shouldExecuteCommand({
      type: 'create',
      aggregateName: 'user',
      aggregateId: 'id',
      payload: {
        item: 'aggregate-id',
      },
    })
})
```
