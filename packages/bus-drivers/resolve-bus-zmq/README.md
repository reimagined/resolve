# **resolve-bus-zmq**  [![npm version](https://badge.fury.io/js/resolve-bus-zmq.svg)](https://badge.fury.io/js/resolve-bus-zmq)

This package is a `resolve-es` driver for emitting events using [ZeroMQ](http://zeromq.org/) (based on the [zeromq](https://www.npmjs.com/package/zeromq) package).

## Available Parameters
You can pass the following arguments when initializing a driver:
* `address` - the ZMQ's IP-address. The default is `127.0.0.1`.

* `channel` - the channel where messages are available. The default is `DEFAULT`.

* `pubPort` - the publisher port. The default is `2110`.

* `subPort` - the subscriber port. The default is `2111`.

## Usage

```js
import createDriver from 'resolve-bus-zeromq'

const driver = createDriver({
  address: '127.0.0.1'
})
```
