# **🏣 resolve-es**

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

eventStore.onEvent(['UserCreated'], event => {
    console.log('Event emitted from bus', event);
});

eventStore.getEventsByAggregateId('1', event => {
    console.log('Aggregate event loaded', event);
});

eventStore.onEvent({ types: ['UserCreated'], ids: ['1'] }, event => {
    console.log('Event emitted from bus by event type of aggregate id', event);
});

const event = {
    aggregateId: '1',
    type: 'UserCreated',
    payload: {
        email: 'test@user.com'
    }
};

eventStore.saveEvent(event);
```
