# **resolve-bus-rabbitmq** [![npm version](https://badge.fury.io/js/resolve-bus-rabbitmq.svg)](https://badge.fury.io/js/resolve-bus-rabbitmq)

This package is a driver for `resolve-es` to emit events using [RabbitMQ](https://www.rabbitmq.com/) (based on the [amqplib](https://www.npmjs.com/package/amqplib) package). It requires RabbitMQ to be installed on your operation system. 

## Available Parameters 
You can pass the following arguments when initializing a driver:
* `url` (required) - URL where RabbitMQ is available.
* `exchange` - exchange name. The default is `exchange`. [Learn more](http://www.squaremobius.net/amqp.node/channel_api.html#channel_assertExchange)
* `queueName` - queue name. The default is `''`.  [Learn more](http://www.squaremobius.net/amqp.node/channel_api.html#channel_assertQueue)
* `exchangeType` - exchange type. The default is `fanout`. [Learn more](http://www.squaremobius.net/amqp.node/channel_api.html#channel_assertExchange)
* `messageTtl` - lifetime of each message. The default is  `2000`.
* `maxLength` - maximum number of messages the queue holds. The default is `10000`.

## Usage

```js
import createDriver from 'resolve-bus-rabbitmq'

const driver = createDriver({
  url: 'amqp://localhost'
})
```
