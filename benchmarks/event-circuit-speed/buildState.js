import memoryDriver from 'resolve-bus-memory';
import createBus from 'resolve-bus';
import mongoDbDriver from 'resolve-es-mongo';
import createEs from 'resolve-es';
import createExecutor from 'resolve-query';

import { INFO_TOKEN, DONE_TOKEN, ERR_TOKEN } from './constants';
import projectionsGenerator from './projections';
import config from './config';

const eventCounterObj = { value: 0 };
let lastReportedEvents = 0;

const store = createEs({ driver: mongoDbDriver({
    url: config.MONGODB_CONNECTION_URL,
    collection: config.MONGODB_COLLECTION_NAME
}) });

const bus = createBus({ driver: memoryDriver() });

const projections = projectionsGenerator(eventCounterObj);

const execute = createExecutor({ store, bus, projections });

function reporterHandler() {
    if (lastReportedEvents !== eventCounterObj.value) {
        const tickSize = eventCounterObj.value - lastReportedEvents;
        // eslint-disable-next-line no-console
        console.log(INFO_TOKEN, tickSize);
        lastReportedEvents = eventCounterObj.value;
    }

    setTimeout(reporterHandler, 500);
}

setTimeout(reporterHandler, 500);

execute('infrastructureState').then(state =>
    // eslint-disable-next-line no-console
    console.log(DONE_TOKEN, JSON.stringify({
        memory: process.memoryUsage(),
        entities: Object.keys(state.groups).length
            + Object.keys(state.members).length
            + Object.keys(state.items).length
    }))
).catch(err =>
    // eslint-disable-next-line no-console
    console.log(ERR_TOKEN, err)
);
