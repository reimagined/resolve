
# **resolve-bus-zmq**  [![npm version](https://badge.fury.io/js/resolve-bus-zmq.svg)](https://badge.fury.io/js/resolve-bus-zmq)

This package is a driver for `resolve-es` to emit events using ZeroMQ.

## Usage

```js
import createDriver from 'resolve-bus-zeromq';

const driver = createDriver({
    url: 'zmq_url'
});
```
