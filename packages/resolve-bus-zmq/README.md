# `resolve-bus-zmq`

This package is a driver for `resolve-bus` to emit events using ZeroMQ.

## Usage

```js
import createDriver from 'resolve-bus-zeromq';

const driver = createDriver({
    url: 'zmq_url'
});
```
