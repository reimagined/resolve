import memoryDriver from 'resolve-bus-memory';
import createBus from 'resolve-bus';
import mongoDbDriver from 'resolve-es-mongo';
import createEs from 'resolve-es';
import createExecutor from 'resolve-query';

import { INFO_TOKEN, DONE_TOKEN, ERR_TOKEN } from './constants';
import projections from './projections';
import config from './config';

const store = createEs({ driver: mongoDbDriver({
    url: config.MONGODB_CONNECTION_URL,
    collection: config.MONGODB_COLLECTION_NAME
}) });

const bus = createBus({ driver: memoryDriver() });

const execute = createExecutor({ store, bus, projections });

let eventCounter = 0;
let lastReportedEvents = 0;

function reporterHandler() {
    if (lastReportedEvents !== eventCounter) {
        const tickSize = eventCounter - lastReportedEvents;
        // eslint-disable-next-line no-console
        console.log(INFO_TOKEN, tickSize);
        lastReportedEvents = eventCounter;
    }

    setTimeout(reporterHandler, 500);
}

setTimeout(reporterHandler, 500);

execute('okrState').then(() =>
    // eslint-disable-next-line no-console
    console.log(DONE_TOKEN, JSON.stringify({
        memory: process.memoryUsage()
    }))
).catch(err =>
    // eslint-disable-next-line no-console
    console.log(ERR_TOKEN, err)
);
