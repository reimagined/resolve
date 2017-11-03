import createEventStore from 'resolve-es';
import storageAdapter from 'resolve-storage-lite';
import busAdapter from 'resolve-bus-zmq';
import query from 'resolve-query';
import { readModel } from 'todo-common';

import config from '../config';

const storage = storageAdapter(config.esFile);
const bus = busAdapter(config.zmq);
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
