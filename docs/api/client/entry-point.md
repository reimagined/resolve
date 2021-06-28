---
id: entry-point
title: Client Entry Point
---

The entry point is a function that is the first to be called when the client script runs. It takes a reSolve context object as a parameter.

##### client/index.js:

```js
const main = async resolveContext => {
...
}
export default main
```

The `resolveContext` object contains data used internally by reSolve client libraries to communicate with the backend.

See the [Client Application Entry Point](frontend.md#client-application-entry-point) section of the [Frontend](frontend.md) article for more information.
