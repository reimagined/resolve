import createEventStore from 'resolve-es';
import storageDriver from 'resolve-storage-file';
import createBus from 'resolve-bus';
import busDriver from 'resolve-bus-zmq';
import query from 'resolve-query';

import { readModels } from 'todo-common';

import config from '../config';

const cardsReadModel = readModels.cards;

const storage = storageDriver(config.esFile);
const bus = createBus({ driver: busDriver(config.zmq) });
const eventStore = createEventStore({ storage, bus });

const queries = query({
    eventStore,
    readModels: [cardsReadModel]
});

process.on('message', (message) => {
    queries(message.payload)
        .then(state =>
            process.send({
                id: message.id,
                state
            })
        )
        .catch(err =>
            process.send({
                id: message.id,
                state: null
            })
        );
});
