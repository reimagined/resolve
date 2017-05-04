# `resolve-bus`

This package serves as a bus for events sending.

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
