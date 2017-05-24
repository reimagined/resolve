# `resolve-bus-zmq`

This package is a driver for `resolve-bus` realizing emitting events using ZeroMQ.

## Usage

```js
import createDriver from 'resolve-bus-zeromq';

const driver = createDriver({
    url: 'zmq_url'
});
```
