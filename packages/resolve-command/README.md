# `resolve-command`

This package creates a function to execute a command.

## Usage

```js
import createHandler from 'resolve-command';
import createStore from 'resolve-storage';
import createEsDriver from 'resolve-storage-memory';
import createBus from 'resolve-bus';
import createBusDriver from 'resolve-bus-memory';

const esDriver = createEsDriver();
const store = createStore({ driver: esDriver });

const busDriver = createBusDriver();
const bus = createBus({ driver: busDriver });

const aggregates = {
    User: {
        commands: {
            Create: ({ aggregateId, payload }) => ({
                type: 'UserCreated',
                aggregateId,
                payload
            })
        }
    }
};

const command = {
    aggregateId: 'test-id',
    aggregateName: 'User',
    commandName: 'Create',
    payload: { email: 'test@user.com' }
};

const execute = createHandler({ store, bus, aggregates });

bus.onEvent(['UserCreated'], event =>
    console.log('Event emitted', event)
);

execute(command);
```
