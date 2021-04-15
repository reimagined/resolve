---
id: testing
title: Testing
---

## Testing Tools

The **@resolve-js/testing-tools** package contains utilities that allow you to test Read Models and Sagas. The provided tools reproduce a Read Model's full lifecycle in the testing environment.

To write a test, call the `givenEvents` function. This function takes an array of events and gives access to a number of functions that you can chain together to describe the test case. The following functions are available:

| Function                                              | Description                                                                                                                                                                                 |
| ----------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `aggregate({ aggregate })`                            | Runs an Aggregate's projection and command handlers.                                                                                                                                        |
| `command(name, payload)`                              | Specifies a command to pass to the Aggregate.                                                                                                                                               |
| `readModel({ name, projection, resolvers, adapter })` | Runs a Read Model projection on the given events and provides access to the Read Model's resolver functions.<br>A resolver function returns a promise that resolves to the response object. |
| `as(jwt)`                                             | Specifies a JSON Web Token used for authentication.                                                                                                                                         |
| `saga({ handlers, sideEffects, adapter, name })`      | Runs a Saga on the given events and provides access to a promise that resolves to an object containing information about the Saga's execution.                                              |
| `properties(sagaProperties)`                          | Specifies Saga properties                                                                                                                                                                   |

## Testing Aggregates

Use the `.aggregate` function to add an aggregate to a test case. Use the following interface to describe the test case for an aggregate:

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
| `shouldThrow(event)`        | Succeeds if the Aggregate throws an exception.                       |

The code sample below demonstrates a **jest** test for an Aggregate:

```js
  ...
  const aggregate:  = {
    name: 'user',
    projection: {
      Init: () => ({
        exist: false
      }),
      TEST_COMMAND_EXECUTED: (state: AggregateState) => ({
        ...state,
        exist: true
      })
    },
    commands: {
      create: (state, command, context) => {
        if (context.jwt !== 'valid-user') {
          throw Error('unauthorized user')
        }
        if (state.exist) {
          throw Error('aggregate already exist')
        }
        return {
          type: 'TEST_COMMAND_EXECUTED',
          payload: {}
        }
      }
    }
  }

  describe('with BDD assertions', () => {
    test('expecting success command execution', () =>
      givenEvents([])
        .aggregate(aggregate)
        .command('create', {})
        .as('valid-user')
        .shouldProduceEvent({
          type: 'TEST_COMMAND_EXECUTED',
          payload: {}
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

Use the `.readModel` function to add a Read Model to a test case. Use the following interface to describe the test case for a Read Model:

### Chainable Functions

| Function                      | Description                                         |
| ----------------------------- | --------------------------------------------------- |
| `as(jwt)`                     | Specifies a JSON Web Token used for authentication. |
| `not()`                       | Invers the assertions.                              |
| `query(resolver, args?)`      | Specifies a query to send to the read model.        |
| `withAdapter(adapter)`        | Specifies a read model adapter to use.              |
| `withEncryption( encryption)` | Specifies an encryption factory function to use.    |
| `withSecretsManager(manager)` | Assigns a secrets manager to the aggregate          |

### Assertions

| Assertion                      | Description                                                                     |
| ------------------------------ | ------------------------------------------------------------------------------- |
| `shouldReturn(expectedResult)` | Specifies the result that should be return by a query defined in the test case. |

The code sample below demonstrates a **jest** test for a Read Model:

<!-- prettier-ignore-start -->

[mdis]:# (../examples/shopping-list/test/unit/read_models.test.js#read-model-test)
```js
    test('projection "SHOPPING_LIST_CREATED" should create a shopping list', async () => {
      const shoppingLists = await givenEvents([
        {
          aggregateId,
          type: SHOPPING_LIST_CREATED,
          payload: {
            name: 'Products'
          }
        }
      ])
        .readModel({
          name: 'ShoppingLists',
          projection,
          resolvers,
          adapter
        })
        .all()

      expect(shoppingLists[0]).toMatchObject({
        id: aggregateId,
        name: 'Products'
      })
    })
```
<!-- prettier-ignore-end -->

In this example, the `.all` function called at the end of the call chain is the `ShoppingLists` Read Model's resolver function. It returns a promise that resolves to the resolver's response object.

## Testing Sagas

Use the `.saga` function to add a saga to a test case. Use the following interface to describe the test case for a saga:

### Chainable Functions

| Function                      | Description                                                          |
| ----------------------------- | -------------------------------------------------------------------- |
| `allowSideEffects()`          | Specifies that saga side effects are allowed.                        |
| `startSideEffectsFrom(date)`  | Specifies the date time from which to start to execute side effects. |
| `withAdapter(adapter)`        | Specifies a read model adapter to use.                               |
| `withEncryption( encryption)` | Specifies an encryption factory function to use.                     |
| `withSecretsManager(manager)` | Assigns a secrets manager to the aggregate                           |

### Assertions

| Assertion                                    | Description                                                                                 |
| -------------------------------------------- | ------------------------------------------------------------------------------------------- |
| `shouldExecuteCommand(shouldExecuteCommand)` | Succeeds if the saga executes the specified command.                                        |
| `shouldExecuteQuery(query)`                  | Succeeds if the saga executes the specified query.                                          |
| `shouldExecuteSideEffect(name, ...args)`     | Succeeds if the saga calls the specified side effect function with the specified arguments. |

The code sample below demonstrates a **jest** test for a Saga:

<!-- prettier-ignore-start -->

[mdis]:# (../tests/saga-sample/saga.test.js#saga-test)
```js
test('success registration', async () => {
  const result = await givenEvents([
    {
      aggregateId: 'userId',
      type: 'USER_CREATED',
      payload: { mail: 'user@example.com' }
    },
    {
      aggregateId: 'userId',
      type: 'USER_CONFIRM_REQUESTED',
      payload: { mail: 'user@example.com' }
    },
    { aggregateId: 'userId', type: 'USER_CONFIRMED', payload: {} }
  ])
    .saga(sagaWithAdapter)
    .properties({
      [RESOLVE_SIDE_EFFECTS_START_TIMESTAMP]: Number.MAX_VALUE
    })

  expect(result).toMatchSnapshot()
})
```
<!-- prettier-ignore-end -->

The `saga` function returns a promise that resolves to an object that contains the following fields:

| Field              | Description                                     |
| ------------------ | ----------------------------------------------- |
| `commands`         | An array of commands generated by the Saga.     |
| `queries`          | An array of queries performed by the Saga.      |
| `scheduleCommands` | An array of commands scheduled by the Saga.     |
| `sideEffects`      | An array of side effects triggered by the Saga. |
