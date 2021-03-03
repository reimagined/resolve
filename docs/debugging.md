---
id: debugging
title: Debugging
---

Resolve uses the [@resolve-js/debug-levels](https://www.npmjs.com/package/@resolve-js/debug-levels) package to log debug information. This package extends the [debug](https://www.npmjs.com/package/debug) library's functionality with the following logging levels:

| Level   | Description                                            |
| ------- | ------------------------------------------------------ |
| log     | Messages that should always be displayed               |
| error   | Errors that can prevent normal program execution       |
| warn    | Potential problems in the application's implementation |
| debug   | Information displayed for debugging purposes           |
| info    | Messages that describe the current operation           |
| verbose | Extended descriptions to the previous message          |

Use the `DEBUG_LEVEL` environment variable to specify the logging level.

## Debug ReSolve

The reSolve framework uses the `resolve` prefix for all its debugging namespaces. To enable the framework's debug output, assign `resolve*` to the `DEBUG` environment variable as shown below:

```
DEBUG=resolve:* DEBUG_LEVEL=error yarn dev
```

The reSolve framework displays **log**, **error**, and **warn** level messages.

## Debug a ReSolve Application

You can add the `@resolve-js/debug-levels` package to your application's dependencies to use [@resolve-js/debug-levels](https://www.npmjs.com/package/@resolve-js/debug-levels) to debug your reSolve application.

```
yarn add @resolve-js/debug-levels
```

To create a logger, pass your module's debugging namespace to the function the `@resolve-js/debug-levels` module exposes:

```js
import debugLevels from '@resolve-js/debug-levels'
const log = debugLevels('myapp:api-handlers')
...
```

The logger object exposes methods that correspond to the available debug levels:

```js
...
log.debug('processing an API request')
log.verbose(`request body: ${JSON.stringify(req.body)}`)
log.verbose(`cookies: ${JSON.stringify(req.cookies)}`)
...
```

Use the `DEBUG` and `DEBUG_LEVEL` environment variables to enable debug messages:

```
DEBUG=myapp:api-handlers DEBUG_LEVEL=verbose yarn dev
```
