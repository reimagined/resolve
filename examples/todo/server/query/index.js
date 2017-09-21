import createEventStore from 'resolve-es';
import storageDriver from 'resolve-storage-lite';
import busDriver from 'resolve-bus-zmq';
import query from 'resolve-query';
import { readModel } from 'todo-common';

import config from '../config';

const storage = storageDriver(config.esFile);
const bus = busDriver(config.zmq);
const eventStore = createEventStore({ storage, bus });

const queries = query({
    eventStore,
    readModel
});

process.on('message', (message) => {
    queries('query { View }')
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
