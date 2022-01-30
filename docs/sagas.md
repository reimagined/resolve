---
id: sagas
title: Sagas
description: A saga describes a long running process as a sequence of events.
---

A saga describes a long running process as a sequence of events.

## Sagas Overview

You can define a saga as a set of event handler functions. Each function runs in response to a specific event and can do the following:

- Send a command to an aggregate
- Schedule a command at the specified moment in time
- Store intermediate data in a persistent storage
- Trigger a side effect

This functionality allows you to organize branched chains of events and side effects to describe processes of any complexity. For example, the code below demonstrates a saga that structures a web site's user registration process:

<!-- prettier-ignore-start -->

[mdis]:# (../tests/saga-sample/saga.js)
```js
/* eslint-disable import/no-anonymous-default-export*/
...
export default {
  handlers: {
    Init: async ({ store }) => {
      await store.defineTable('users', {
        indexes: { id: 'string' },
        fields: ['mail'],
      })
    },
    USER_CREATED: async ({ store, sideEffects }, event) => {
      await store.insert('users', {
        id: event.aggregateId,
        mail: event.payload.mail,
      })
      await sideEffects.executeCommand({
        aggregateName: 'User',
        aggregateId: event.aggregateId,
        type: 'requestConfirmUser',
        payload: event.payload,
      })
    },
    USER_CONFIRM_REQUESTED: async ({ sideEffects }, event) => {
      await sideEffects.sendEmail(event.payload.mail, 'Confirm mail')
      await sideEffects.scheduleCommand(
        event.timestamp + 1000 * 60 * 60 * 24 * 7,
        {
          aggregateName: 'User',
          aggregateId: event.aggregateId,
          type: 'forgetUser',
          payload: {},
        }
      )
    },
    USER_FORGOTTEN: async ({ store }, event) => {
      await store.delete('users', {
        id: event.aggregateId,
      })
    },
  },
  sideEffects: {
    sendEmail: async (mail, content) => {
      ...
    },
  },
}
```

<!-- prettier-ignore-end -->

The saga requests that a new user confirms his/her email address. If the user does not confirm the address within one week, the saga cancels the registration.

## Define a Saga

### Add a Saga to the Application

You can define a saga in one of the following ways:

- In one source file as an object that contains the `handlers` and `sideEffects` objects.

  **common/sagas/user-confirmation.saga.js:**

  ```js
  export default {
    handlers: {
      // Event handlers implementation
    }
    sideEffects: {
      // Side effects implementation
    }
  }
  ```

- In two separate files.

  **common/sagas/user-confirmation.handlers.js:**

  ```js
  export default {
    // Event handlers implementation
  }
  ```

  **common/sagas/user-confirmation.side-effects.js:**

  ```js
  export default {
    // Side effects implementation
  }
  ```

### Initialize the EventStore

Every saga should define an `Init` function that initializes the saga's persistent storage:

<!-- prettier-ignore-start -->

[mdis]:# (../tests/saga-sample/saga.js#init)
```js
Init: async ({ store }) => {
  await store.defineTable('users', {
    indexes: { id: 'string' },
    fields: ['mail'],
  })
},
```

<!-- prettier-ignore-end -->

### Handle Events

An event handler function runs for each occurrence of a specific event. It has the following general structure:

```js
EVENT_NAME: async ({ store, sideEffects }, event) => {
  // Event handler logic
}
```

As a first argument, an event handler receives an object that provides access to the following API:

- `store` - Provides access to the saga's persistent store (similar to the Read Model store).
- `sideEffects` - Provides access to the saga's side effect functions.

### Use Side Effects

You should define all functions that have side effects in the `sideEffects` object.

<!-- prettier-ignore-start -->

[mdis]:# (../tests/saga-sample/saga.js#define-side-effect)
```js
sideEffects: {
  sendEmail: async (mail, content) => {
    ...
  },
},
```

<!-- prettier-ignore-end -->

You can trigger the defined side effects from an event handler as shown below:

<!-- prettier-ignore-start -->

[mdis]:# (../tests/saga-sample/saga.js#trigger-side-effect)
```js
await sideEffects.sendEmail(event.payload.mail, 'Confirm mail')
```

<!-- prettier-ignore-end -->

The following side effect functions are available by default:

- `executeCommand` - Sends a command with the specified payload to an aggregate.
- `scheduleCommand` - Similar to `executeCommand`, but delays command execution until a specified moment in time.

#### Side Effect Starting Timestamp

Each saga stores a `RESOLVE_SIDE_EFFECTS_START_TIMESTAMP` property. This property's value is a timestamp that defines the latest point in time for which side effects are allowed. If an event is older than this timestamp, all side effect functions for the current event handler are replaced with stub functions that do nothing. This is required to guarantee that side effect logic is never invoked more than once for a given event. Note that if you reset the Saga, the timestamp is preserved and side effects are not re-invoked as the saga rebuilds its state.

The `sideEffects` object's `isEnabled` field indicates whether or not side effects are enabled for the processed event.

If your need to re-run side effects after you reset a saga's state, use the [@resolve-js/module-admin](https://www.npmjs.com/package/@resolve-js/module-admin) CLI tool to assign the desired timestamp to the `RESOLVE_SIDE_EFFECTS_START_TIMESTAMP` property:

```bash
npx @resolve-js/module-admin sagas properties set "UserConfirmation" "RESOLVE_SIDE_EFFECTS_START_TIMESTAMP" $(date +%s%3N -d "yesterday")
```

You can also specify a new timestamp as an option for the `sagas reset` command:

```bash
npx @resolve-js/module-admin sagas reset UserConfirmation --side-effects-start-timestamp 0000-00-0000:00:00.000
```

### Send Aggregate Commands

Use the `executeCommand` side effect function to send aggregate commands as shown below:

<!-- prettier-ignore-start -->

[mdis]:# (../tests/saga-sample/saga.js#execute)
```js
await sideEffects.executeCommand({
  aggregateName: 'User',
  aggregateId: event.aggregateId,
  type: 'requestConfirmUser',
  payload: event.payload,
})
```

<!-- prettier-ignore-end -->

### Schedule Aggregate Commands

The code sample below demonstrates how the command executes at a specified point in time.

<!-- prettier-ignore-start -->

[mdis]:# (../tests/saga-sample/saga.js#schedule)
```js
await sideEffects.scheduleCommand(
  event.timestamp + 1000 * 60 * 60 * 24 * 7,
  {
    aggregateName: 'User',
    aggregateId: event.aggregateId,
    type: 'forgetUser',
    payload: {},
  }
)
```

<!-- prettier-ignore-end -->

## Register a Saga

To use a saga in your application, you need to register it in the application's configuration file. If a saga is defined in a single file, you can register it as shown below:

```js
sagas: [
  {
    name: 'UserConfirmation',
    source: 'common/sagas/user-confirmation.saga.js',
    connectorName: 'default',
  },
]
```

If a saga is split between two files, register it as follows:

```js
sagas: [
  {
    name: 'UserConfirmation',
    source: 'common/sagas/user-confirmation.handlers.js',
    sideEffects: 'common/sagas/user-confirmation.side-effects.js',
    connectorName: 'default',
  },
]
```

The `connectorName` option defines a Read Model storage used to store the saga's persistent data.
