---
id: projection
title: Projection
---

:::info TypeScript Support

A view model projection object has an associated TypeScript type:

- Type Name - `ViewModelProjection`
- Package - `@resolve-js/core`

:::

A view model projection is an object of the following structure:

```js
const projection = {
  // The *Init* function creates the view model's initial state object.
  Init: () => initialState,
  // An event handler function is associated with an event type.
  // It receives the view model's state and an incoming event
  // and returns the updated state.
  [EVENT_TYPE]: (state, event) => {
    ...
    return newState
  }
  [EVENT_TYPE2]: (state, event) => ...
  [EVENT_TYPE3]: (state, event) => ...
  ...
}
```

An event handler implementation receives the following arguments:

| Argument Name | Description                                                                                                                                    |
| ------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| state         | The view model's state that is an object of arbitrary structure.                                                                               |
| event         | An [event](../event.md) object.                                                                                                                |
| args          | Arguments attached to the request.                                                                                                             |
| context       | An object that contains functions and data related to the current operation (see the [Event Handler Context](#event-handler-context) section.) |

An event handler should return a new state object.

## Context

A view model event handler context is an object with the following fields:

| Field Name | Description                                               |
| ---------- | --------------------------------------------------------- |
| jwt        | The JSON Web Token attached to the request.               |
| encrypt    | The user-defined [encrypt](../../encryption.md) function. |
| decrypt    | The user-defined [decrypt](../../encryption.md) function. |
