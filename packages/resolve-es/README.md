# `resolve-es`

This package serves as an event-store.

# Usage
```js
import createEventStore from 'resolve-es';
import createStorage from 'resolve-storage';
import storageInFileDriver from 'resolve-storage-file';
import createBus from 'resolve-bus';
import busInMemoryDriver from 'resolve-bus-memory';
import commandHandler from 'resolve-command';
import query from 'resolve-query';

const storage = createStorage({
    driver: storageInFileDriver({ pathToFile: './EventStore' })
});
const bus = createBus({ driver: busInMemoryDriver() });

const eventStore = createEventStore({
    storage,
    bus
});

const execute = commandHandler({
    eventStore,
    aggregates: [todoCardAggregate, todoItemAggregate]
});

const queries = query({
    eventStore,
    readModels: [cardsProjection, cardDetailsProjection]
});
```

## Advanced Usage (Transform events / Plugins)
```js
const transforms = [
    new Transform({
        objectMode: true,
        transform(event, encoding, callback) {
            event.isTransformed = true;
            this.push(event);
            callback();
        }
    })
];

const eventStore = createEventStore({
    storage,
    bus,
    transforms
});
```
