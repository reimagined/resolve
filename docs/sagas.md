---
id: sagas
title: Sagas
---

A saga describes a long running process as a sequence of events.

## Sagas Overview

You can define a saga as a set of event handler functions. Each such function runs in response to a specific event and can do the following:

- Send a command to an aggregate
- Schedule a command with the specified time offset
- Store intermediate data in a persistent storage
- Trigger a side effect

This allows you to organize branching chains of events and side effects to describe processes of any complexity. For example, the code below demonstrates a saga that organizes a web site's user registration process:

<!-- prettier-ignore-start -->

[mdis]:# (../tests/saga-sample/saga.js)
```js
export default {
  handlers: {
    Init: async ({ store }) => {
      await store.defineTable('users', {
        indexes: { id: 'string' },
        fields: ['mail']
      })
    },
    USER_CREATED: async ({ store, executeCommand }, event) => {
      await store.insert('users', {
        id: event.aggregateId,
        mail: event.payload.mail
      })
      await executeCommand({
        aggregateName: 'User',
        aggregateId: event.aggregateId,
        type: 'requestConfirmUser',
        payload: event.payload
      })
    },
    USER_CONFIRM_REQUESTED: async ({ sideEffects, scheduleCommand }, event) => {
      await sideEffects.sendEmail(event.payload.mail, 'Confirm mail')
      await scheduleCommand(event.timestamp + 1000 * 60 * 60 * 24 * 7, {
        aggregateName: 'User',
        aggregateId: event.aggregateId,
        type: 'forgetUser',
        payload: {}
      })
    },
    USER_FORGOTTEN: async ({ store }, event) => {
      await store.delete('users', {
        id: event.aggregateId
      })
    }
  },
  sideEffects: {
    sendEmail: async (mail, content) => {
      ...
    }
  }
}
```

<!-- prettier-ignore-end -->

This saga requires a new user to confirm their email address. If a user does not confirm the address in a week, the saga cancels the registration.

## Define a Saga

### Add a Saga to the Application

You can define a saga in one of the following two ways:

- In one source file as an object that contains the `handlers` and `sideEffects` objects.

  ##### common/sagas/user-confirmation.saga.js:

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

  ##### common/sagas/user-confirmation.handlers.js:

  ```js
  export default {
    // Event handlers implementation
  }
  ```

  ##### common/sagas/user-confirmation.side-effects.js:

  ```js
  export default {
    // Side effects implementation
  }
  ```

### Initialize the Storage

Every saga should define an `Init` function that initializes the saga's persistent storage:

[mdis]: # '../tests/saga-sample/saga.js#init'

```js
Init: async ({ store }) => {
  await store.defineTable('users', {
    indexes: { id: 'string' },
    fields: ['mail']
  })
},
```

### Handle Events

An event handler function runs for every occurrence of a specific event. It has the following general structure:

```js
EVENT_NAME: async (
  { executeCommand, scheduleCommand, store, sideEffects },
  event
) => {
  // Event handler logic
}
```

As a first argument, an event handler receives an object that provides access to the saga-related API. This API includes the following functions:

- `executeCommand` - Sends a command with the specified payload to an aggregate.
- `scheduleCommand` - Similar to `executeCommand` but delays the command execution until the specified moment in time.
- `store` - Provides access to the saga's persistent store (similar to the Read Model store).
- `sideEffects` - Provides access to the saga's side effect functions.

### Send Aggregate Commands

Use the `executeCommand` function to send aggregate commands as shown below:

```js
await executeCommand({
  type: 'rejectUser',
  aggregateName: 'User',
  aggregateId,
  payload: {
    reason: 'user with same name already registered and confirmed'
  }
})
```

### Schedule Aggregate Commands

The code sample below demonstrates how the command execution on a moment in time.

```js
await scheduleCommand(timestamp + 3600000, {
  type: 'rejectUser',
  aggregateName: 'User',
  aggregateId,
  payload: {
    reason: 'user registration was not confirmed within allowed period'
  }
})
```

### Use Side Effects

You should define all functions that have side effects in the `sideEffects` object.

```js
sideEffects: {
  sendEmail: async (mail, content) => {
    ...
  }
}
```

You can trigger the defined side effects from an event handler as shown below:

```js
await sideEffects.sendEmail(
  'admin@resolve.sh',
  `${name} registration request`,
  `Please confirm registration or the user will be deleted during 1 hour`
)
```

## Register a Saga

To use a saga in your application, you need to register it in the application's configuration file. If a saga is defined in a single file, you can register it as shown below:

```js
sagas: [
  {
    name: 'UserConfirmation',
    source: 'common/sagas/user-confirmation.saga.js',
    connectorName: 'default',
    schedulerName: 'scheduler'
  }
]
```

If a saga is split between two files, you can register it as follows:

```js
sagas: [
  {
    name: 'UserConfirmation',
    handlers: 'common/sagas/user-confirmation.handlers.js',
    sideEffects: 'common/sagas/user-confirmation.side-effects.js',
    connectorName: 'default',
    schedulerName: 'scheduler'
  }
]
```

The `connectorName` option defines a Read Model storage used to store the saga's persistent data.

The `schedulerName` option specifies the scheduler that should be used to schedule command execution. Define a scheduler in the `schedulers` configuration section:

```js
schedulers: {
  scheduler: {
    adapter: {
      module: 'resolve-scheduler-local',
      options: {}
    },
    connectorName: 'default'
  }
},
```
