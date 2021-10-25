# **@resolve-js/monitoring-aws-cloudwatch**

[![npm version](https://badge.fury.io/js/%40resolve-js%2Fmonitoring-aws-cloudwatch.svg)](https://badge.fury.io/js/%40resolve-js%2Fmonitoring-aws-cloudwatch)

This package serves as a monitoring adapter for reSolve that publishes metrics to AWS CloudWatch.

## Available Options

You can specify the following options to configure the monitoring adapter:

- `deploymentId`- Specifies the cloud deployment ID.
- `resolveVersion` - Specifies the reSolve version.

## Usage

```js
// config.prod.js
import resolveVersion from '$resolve.resolveVersion'

const prodConfig = {
  monitoringAdapters: {
    default: {
      module: '@resolve-js/monitoring-aws-cloudwatch',
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
