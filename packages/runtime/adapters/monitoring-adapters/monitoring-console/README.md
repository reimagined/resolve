# **@resolve-js/monitoring-console**

[![npm version](https://badge.fury.io/js/%40resolve-js%2Fmonitoring-console.svg)](https://badge.fury.io/js/%40resolve-js%2Fmonitoring-console)

This package serves as a monitoring adapter for reSolve that prints monitoring metrics to the text console.

## Available Options

You can specify the following options to configure the monitoring adapter:

- `publishMode`- Specifies when to display a summary on the collected metrics in the console.
  Available values: `all`, `resolveDispose` and `processExit`. Default: `processExit`.

## Usage

```js
// config.prod.js
const prodConfig = {
  monitoringAdapters: {
    default: {
      module: '@resolve-js/monitoring-console',
      options: {
        publishMode: 'processExit',
      },
    },
  },
  ...
}
```

![Analytics](https://ga-beacon.appspot.com/UA-118635726-1/packages-resolve-monitoring-console-readme?pixel)
