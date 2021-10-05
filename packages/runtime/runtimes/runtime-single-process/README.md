# **@resolve-js/runtime-single-process**

[![npm version](https://badge.fury.io/js/%40resolve-js%2Fruntime-single-process.svg)](https://badge.fury.io/js/%40resolve-js%2Fruntime-single-process)

This package contains a runtime backend server that targets a standalone server or local machine.

## Available Options

You can specify the following options to configure the runtime:

- `importMode`- Specifies whether to use static or dynamic imports between the application's modules.
- `host` - Specifies the network host on which to listen for connections. Defaults to `'0.0.0.0'`.
- `port` - Specifies the server application's port.

## Usage

```js
// config.prod.js
const prodConfig = {
  runtime: {
    module: '@resolve-js/runtime-single-process',
    options: {
      host: declareRuntimeEnv('HOST', 'localhost'),
      port: declareRuntimeEnv('PORT', '3000'),
    },
  },
  ...
}
```

![Analytics](https://ga-beacon.appspot.com/UA-118635726-1/packages-resolve-runtime-single-process-readme?pixel)
