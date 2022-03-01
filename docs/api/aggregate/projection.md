---
id: projection
title: Projection
---

:::info TypeScript Support

An aggregate projection object has an associated TypeScript type:

- Type Name - `AggregateProjection`
- Containing Package - `@resolve-js/core`

:::

An aggregate projection is an object of the following structure:

```js
const projection = {
  // The *Init* function creates the initial aggregate state object.
  Init: () => initialState,
  // An event handler function is associated with an event type.
  // It receives the aggregate state and an incoming event
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

| Argument Name | Description                                                   |
| ------------- | ------------------------------------------------------------- |
| state         | The aggregate state that is an object of arbitrary structure. |
| event         | An [event](../event.md) object.                               |

An event handler should return a new state object.
