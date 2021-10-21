# **@resolve-js/monitoring-aws-cloudwatch**

[![npm version](https://badge.fury.io/js/%40resolve-js%2Fmonitoring-aws-cloudwatch.svg)](https://badge.fury.io/js/%40resolve-js%2Fmonitoring-aws-cloudwatch)

This package serves as a resolve monitoring adapter for publishing metrics into AWS CloudWatch.

## Available Options

You can specify the following options to configure the monitoring adapter:

- `deploymentId`- Specifies cloud deployment ID
- `resolveVersion` - Specifies resolve version

## Usage

```js
// config.prod.js
import resolveVersion from '$resolve.resolveVersion'

const prodConfig = {
  monitoringAdapters: {
    default: {
      module: '@resolve-js/monitoring-console',
      options: {
        deploymentId: declareRuntimeEnv('RESOLVE_DEPLOYMENT_ID'),
        resolveVersion,
      },
    },
  },
  ...
}
```

![Analytics](https://ga-beacon.appspot.com/UA-118635726-1/packages-resolve-monitoring-aws-cloudwatch-readme?pixel)
