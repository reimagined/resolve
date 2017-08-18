# `resolve-bus-rabbitmq`

This package is a driver for `resolve-es` to emit events using RabbitMQ.

## Usage

```js
import createDriver from 'resolve-bus-rabbitmq';

const driver = createDriver({
    url: 'rabbitmq_url'
});
```
