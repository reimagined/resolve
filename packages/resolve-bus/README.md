# `resolve-bus`

This package serves as a bus for sending events with a driver specifying where to send events. The following drivers are available for this package:
- [resolve-bus-memory](https://github.com/reimagined/resolve/tree/master/packages/resolve-bus-memory) - to emit events using memory
- [resolve-bus-rabbitmq](https://github.com/reimagined/resolve/tree/master/packages/resolve-bus-rabbitmq) - to emit events using RabbitMQ
- [resolve-bus-zmq](https://github.com/reimagined/resolve/tree/master/packages/resolve-bus-zmq) - to emit events using ZeroMQ

## Usage

```js
import createBus from 'resolve-bus';
import createDriver from 'resolve-bus-memory';

const driver = createDriver();
const bus = createBus({ driver });

const event = {
    type: 'userCreated',
    payload: {
        email: 'test@user.com'
    }
};

bus.onEvent(['userCreated'], event =>
    console.log('event emitted', event)
);

bus.emitEvent(event);
```

## API

- `emitEvent`
- `onEvent`
