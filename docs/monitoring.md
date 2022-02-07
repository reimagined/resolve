---
id: monitoring
title: Monitoring
---

ReSolve includes an inbuilt monitoring mechanism that allows a reSolve application to collect and publish various metrics during its execution.

## Monitoring Adapters

Monitoring adapters define how the metrics are collected are published. The following adapters are included:

| Module Name                                                                                                 | Description                                              |
| ----------------------------------------------------------------------------------------------------------- | -------------------------------------------------------- |
| [`@resolve-js/monitoring-console`](application-configuration.md#resolve-jsmonitoring-console)               | Prints the collected metrics to the text console output. |
| [`@resolve-js/monitoring-aws-cloudwatch`](application-configuration.md#resolve-jsmonitoring-aws-cloudwatch) | Publishes the collected metrics to AWS CloudWatch.       |

An application's monitoring adapters are specified in the application's configuration files:

```js title="/app-config.js"
monitoringAdapters: {
  console: {
    module: '@resolve-js/monitoring-console',
    options: {
      publishMode: 'processExit',
    },
  },
  ...
}
```

Refer to the [monitoringAdapters](application-configuration.md#monitoringadapters) section of the [Application Configuration](application-configuration.md) topic for more information on monitoring adapter options.

On a local machine or a standalone server, you need to explicitly specify the monitoring adapter to enable monitoring.

In the reSolve Cloud environment, the `default` monitoring adapter always exists. If this adapter is not explicitly specified in the application's configuration files, it defaults to `@resolve-js/monitoring-aws-cloudwatch`.

You can implement your own monitoring adapter based on the `@resolve-js/monitoring-base` package. Refer to the [Monitoring Adapter](api/monitoring/monitoring-adapter.md) API reference topic for information on how to achieve this.

## Monitoring API

You can access the monitoring API through the [reSolve context](api/api-handler/resolve-context.md) object. For example, the following code sample demonstrates how to access the monitoring API in an [API handler](api/api-handler/api-handler.md) function:

```js
const myHandler = async (req, res) => {
  const {resolve: { monitoring } } = req
  const metrics = monitoring.getMetrics('default')
  ...
}
```

To learn about the API exposed by this object, see the [Monitoring Interface](api/monitoring/monitoring.md) article.
