# **🏣 resolve-es** [![npm version](https://badge.fury.io/js/resolve-es.svg)](https://badge.fury.io/js/resolve-es)

This package serves as an event-store.

# Usage
```js
import createEventStore from 'resolve-es';
import storageInFileDriver from 'resolve-storage-file';
import busInMemoryDriver from 'resolve-bus-memory';

const storage = storageInFileDriver({ pathToFile: './event-store.json' });

const bus = busInMemoryDriver();

const eventStore = createEventStore({
    storage,
    bus
});

eventStore.subscribeByEventType(['UserCreated'], event => {
    console.log('Event emitted', event);
});

eventStore.subscribeByEventType(
    ['UserCreated'],
    event => console.log('Event emitted from bus', event),
    true
);

eventStore.getEventsByAggregateId('aggregate-id', event => {
    console.log('Aggregate event loaded', event);
});

eventStore.subscribeByAggregateId(
    ['aggregate-id'],
    event => console.log('Event emitted from by aggregate id', event),
    true
);

const event = {
    aggregateId: '1',
    type: 'UserCreated',
    payload: {
        email: 'test@user.com'
    }
};

eventStore.saveEvent(event);
```
