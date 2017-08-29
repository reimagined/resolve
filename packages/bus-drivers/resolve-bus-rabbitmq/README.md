# **resolve-bus-rabbitmq** [![npm version](https://badge.fury.io/js/resolve-bus-rabbitmq.svg)](https://badge.fury.io/js/resolve-bus-rabbitmq)

This package is a driver for `resolve-es` to emit events using RabbitMQ.

## Usage

```js
import createDriver from 'resolve-bus-rabbitmq';

const driver = createDriver({
    url: 'rabbitmq_url'
});
```
