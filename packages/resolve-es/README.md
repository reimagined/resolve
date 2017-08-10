# `resolve-es`

This package serves as an event-store.

# Usage
```js
import createEventStore from 'resolve-es';
import createStorage from 'resolve-storage';
import storageInFileDriver from 'resolve-storage-file';
import createBus from 'resolve-bus';
import busInMemoryDriver from 'resolve-bus-memory';

const storage = createStorage({
    driver: storageInFileDriver({ pathToFile: './event-store.json' })
});
const bus = createBus({ driver: busInMemoryDriver() });

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

const event = {
    aggregateId: '1',
    type: 'UserCreated',
    payload: {
        email: 'test@user.com'
    }
};

eventStore.saveEvent(event);

```
