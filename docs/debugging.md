---
id: debugging
title: Debugging
---

Resolve uses the [resolve-debug-levels](https://www.npmjs.com/package/resolve-debug-levels) package to log debug information. This package extends the [debug](https://www.npmjs.com/package/debug) module's functionality with multiple logging levels. The package provides the following debug levels:

| Level   | Description                                                              |
| ------- | ------------------------------------------------------------------------ |
| log     | Information that should always be displayed                              |
| error   | Messages related to errors that can hinder normal program execution      |
| warn    | Information about potential problems in the application's implementation |
| debug   | Information displayed for debugging purposes                             |
| info    | Information about the current operation                                  |
| verbose | Extended descriptions to the previous message                            |

## Debug Resolve

To view debug messages produced by the reSolve framework use the assign the `resolve*` prefix to the DEBUG environment variable.

```
DEBUG=resolve* DEBUG-LEVEL=warnings yarn dev
```

## Debug Resolve Application

Add the [resolve-debug-levels](https://www.npmjs.com/package/resolve-debug-levels) package to your project. You generate a debug message as shown below:

```js
import debugLevels from 'resolve-debug-levels'
const log = debugLevels('myapp:api-handlers')
...
log.debug('processing an API request')
log.verbose(`request body: ${JSON.stringify(req.body)}`)
log.verbose(`cookies: ${JSON.stringify(cookies)}`)
```

You can run your app with the all the specified debug messages as shown below:

```
DEBUG=myapp* DEBUG-LEVEL=verbose yarn dev
```
