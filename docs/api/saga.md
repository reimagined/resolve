---
id: saga
title: Saga
---

A saga's event handler receives an object that provides access to the saga-related API. This API includes the following objects:

| Object Name | Description                                                                       |
| ----------- | --------------------------------------------------------------------------------- |
| store       | Provides access to the saga's persistent store (similar to the Read Model store). |
| sideEffects | Provides access to the saga's side effect functions.                              |

In addition to user-defined side effect functions, the `SideEffects` object contains the following default side effects:

| Function Name                       | Description                                                                                 |
| ----------------------------------- | ------------------------------------------------------------------------------------------- |
| [executeCommand](#executecommand)   | Sends a command with the specified payload to an aggregate.                                 |
| [scheduleCommand](#schedulecommand) | Similar to `executeCommand`, but delays command execution until a specified moment in time. |

The `sideEffects` object's `isEnabled` field indicates whether or not side effects are enabled for the saga.

### executeCommand

Sends a command with the specified payload to an aggregate.

#### Arguments

| Argument Name | Description                                                                                                             |
| ------------- | ----------------------------------------------------------------------------------------------------------------------- |
| command       | Specifies a command object. Refer to the [Write Side](../write-side.md#sending-a-command) article for more information. |

#### Example

<!-- prettier-ignore-start -->

[mdis]:# (../tests/saga-sample/saga.js#execute)
```js
await sideEffects.executeCommand({
  aggregateName: 'User',
  aggregateId: event.aggregateId,
  type: 'requestConfirmUser',
  payload: event.payload
})
```

<!-- prettier-ignore-end -->

### scheduleCommand

Similar to `executeCommand` but delays the command's execution until a specified moment in time.

#### Arguments

| Argument Name | Description                                                                                                             |
| ------------- | ----------------------------------------------------------------------------------------------------------------------- |
| command       | Specifies a command object. Refer to the [Write Side](../write-side.md#sending-a-command) article for more information. |

#### Example

<!-- prettier-ignore-start -->

[mdis]:# (../tests/saga-sample/saga.js#schedule)
```js
await sideEffects.scheduleCommand(
  event.timestamp + 1000 * 60 * 60 * 24 * 7,
  {
    aggregateName: 'User',
    aggregateId: event.aggregateId,
    type: 'forgetUser',
    payload: {}
  }
)
```

<!-- prettier-ignore-end -->
