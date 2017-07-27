import createEventStore from 'resolve-es';
import createStorage from 'resolve-storage';
import storageDriver from 'resolve-storage-file';
import createBus from 'resolve-bus';
import busDriver from 'resolve-bus-zmq';
import query from 'resolve-query';

import { projections } from 'todo-common';
const cardsProjection = projections.cards;

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

const queries = query({
    eventStore,
    projections: [cardsProjection]
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
