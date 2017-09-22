import createEventStore from 'resolve-es';
import storageDriver from 'resolve-storage-lite';
import busDriver from 'resolve-bus-zmq';
import commandHandler from 'resolve-command';

import { aggregates } from 'todo-common';

import config from '../config';

const todoCardAggregate = aggregates.TodoCard;
const todoItemAggregate = aggregates.TodoItem;

const storage = storageDriver(config.esFile);
const bus = busDriver(config.zmq);

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
