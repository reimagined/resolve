# `resolve-command`

This package is commands handler.

## Usage

```js
import createHandler from 'resolve-command';
import createStore from 'resolve-es';
import createEsDriver from 'resolve-es-memory';
import createBus from 'resolve-bus';
import createBusDriver from 'resolve-bus-memory';

const esDriver = createEsDriver();
const store = createStore({ driver: esDriver });

const busDriver = createBusDriver();
const bus = createBus({ driver: busDriver });

const aggregate = {
    commands: {
        Create: ({ aggregateId, payload }) => ({
            type: 'UserCreated',
            aggregateId,
            payload
        })
    }
};

const command = {
    aggregateId: 'test-id',
    commandName: 'Create',
    payload: { email: 'test@user.com' }
};

const execute = createHandler({ store, bus, aggregate });

bus.onEvent(['UserCreated'], event =>
    console.log('Event emitted', event)
);

execute(command);
```
