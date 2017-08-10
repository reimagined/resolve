# `resolve-command`

This package creates a function to execute a command.

## Usage

```js
import commandHandler from 'resolve-command';
import createStore from 'resolve-storage';
import createEsDriver from 'resolve-storage-memory';
import createBus from 'resolve-bus';
import createBusDriver from 'resolve-bus-memory';
import createEventStore from 'resolve-es';

const esDriver = createEsDriver();
const storage = createStore({ driver: esDriver });

const busDriver = createBusDriver();
const bus = createBus({ driver: busDriver });

const aggregates = [{
    name: 'User',
    initialState: {},
    eventHandlers: {
        UserCreated: (state, { payload }) => ({
            name: payload.name,
            email: payload.email,
        })
    },
    commands: {
        create: (state, { aggregateId, payload }) => ({
            type: 'UserCreated',
            aggregateId,
            payload
        })
    }
}];

const eventStore = createEventStore({ storage, bus });

const execute = commandHandler({
    eventStore,
    aggregates
});

eventStore.onEvent(['UserCreated'], event =>
    console.log('Event emitted', event);
);

const command = {
    aggregateId: '1',
    aggregateName: 'User',
    type: 'create',
    payload: {
        name: 'User Name',
        email: 'test@user.com'
    }
};

execute(command).then(event => {
    console.log('Event saved', event);
});

```
