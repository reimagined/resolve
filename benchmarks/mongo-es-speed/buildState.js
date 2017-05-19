import mongoDbDriver from 'resolve-es-mongo';
import createEs from 'resolve-es';

import { INFO_TOKEN, DONE_TOKEN, ERR_TOKEN } from './constants';
import config from './config';

const TYPES = config.GENERATED_EVENT_TYPES;

const store = createEs({
    driver: mongoDbDriver({
        url: config.MONGODB_CONNECTION_URL,
        collection: config.MONGODB_COLLECTION_NAME
    })
});

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

store
    .loadEventsByTypes(TYPES, () => eventCounter++)
    .then(() =>
        // eslint-disable-next-line no-console
        console.log(
            DONE_TOKEN,
            JSON.stringify({
                memory: process.memoryUsage()
            })
        )
    )
    .catch(err =>
        // eslint-disable-next-line no-console
        console.log(ERR_TOKEN, err)
    );
