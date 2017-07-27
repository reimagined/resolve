import createEventStore from 'resolve-es';
import createStorage from 'resolve-storage';
import storageDriver from 'resolve-storage-file';
import createBus from 'resolve-bus';
import busDriver from 'resolve-bus-zmq';
import commandHandler from 'resolve-command';

import { aggregates } from 'todo-common';

const todoCardAggregate = aggregates.TodoCard;
const todoItemAggregate = aggregates.TodoItem;

const storage = createStorage({
    driver: storageDriver({ pathToFile: './event_store.json' })
});
const bus = createBus({
    driver: busDriver({
        address: '127.0.0.1',
        pubPort: 3500,
        subPort: 3501
    })
});

const eventStore = createEventStore({ storage, bus });

const execute = commandHandler({
    eventStore,
    aggregates: [todoCardAggregate, todoItemAggregate]
});

process.on('message', (message) => {
    execute(message.payload)
        .then(() =>
            process.send({
                id: message.id,
                state: null
            })
        )
        .catch(err =>
            process.send({
                id: message.id,
                state: err
            })
        );
});
