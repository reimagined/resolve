
# **resolve-bus-zmq**  [![npm version](https://badge.fury.io/js/resolve-bus-zmq.svg)](https://badge.fury.io/js/resolve-bus-zmq)

This package is a driver for `resolve-es` to emit events using [ZeroMQ](http://zeromq.org/) (based on the [zeromq](https://www.npmjs.com/package/zeromq) package).

## Available Parameters
You can pass the following arguments when initializing a driver:
* `address` - IP-address where ZMQ is placed. The default is `127.0.0.1`.

* `channel` - channel where messages will be available. The default is `DEFAULT`.

* `pubPort` - publisher port. The default is `2110`.

* `subPort` - subscriber port. By default it equals to `2111`.

## Usage

```js
import createDriver from 'resolve-bus-zeromq'

const driver = createDriver({
  address: '127.0.0.1'
})
```
