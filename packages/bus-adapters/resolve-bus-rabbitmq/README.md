# **resolve-bus-rabbitmq**
[![npm version](https://badge.fury.io/js/resolve-bus-rabbitmq.svg)](https://badge.fury.io/js/resolve-bus-rabbitmq)

This package is a `resolve-es` adapter for emitting events using [RabbitMQ](https://www.rabbitmq.com/) (based on the [amqplib](https://www.npmjs.com/package/amqplib) package). It requires RabbitMQ to be installed on your machine. 

## Available Parameters 
You can pass the following arguments when initializing an adapter:
* `url` (required) - the RabbitMQ URL.
* `exchange` - an exchange name. The default is `exchange`. [Learn more](http://www.squaremobius.net/amqp.node/channel_api.html#channel_assertExchange)
* `queueName` - a queue name. The default is `''`.  [Learn more](http://www.squaremobius.net/amqp.node/channel_api.html#channel_assertQueue)
* `exchangeType` - the exchange type. The default is `fanout`. [Learn more](http://www.squaremobius.net/amqp.node/channel_api.html#channel_assertExchange)
* `messageTtl` - a message's lifetime. The default is  `2000`.
* `maxLength` - the maximum number of messages the queue holds. The default is `10000`.

## Usage

```js
import createAdapter from 'resolve-bus-rabbitmq'

const adapter = createAdapter({
  url: 'amqp://localhost'
})
```
