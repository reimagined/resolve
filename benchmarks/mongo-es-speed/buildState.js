/* eslint-disable import/no-extraneous-dependencies */
import mongoDbDriver from 'resolve-es-mongo';
import createEs from 'resolve-es';
/* eslint-enable */

import config from './config';

const TYPES = config.GENERATED_EVENT_TYPES;

const store = createEs({ driver: mongoDbDriver({
    url: config.MONGODB_CONNECTION_URL,
    collection: config.MONGODB_COLLECTION_NAME
}) });

const DONE_TOKEN = '-------DONE-------';
const INFO_TOKEN = '-------INFO-------';
const ERR_TOKEN = '-------ERR-------';

let eventCounter = 0;

function eventHandler() {
    if (++eventCounter % 5000 === 0) {
        // eslint-disable-next-line no-console
        console.log(INFO_TOKEN, JSON.stringify({
            appendProgress: 5000
        }));
    }
}

store.loadEventsByTypes(TYPES, eventHandler).then(() =>
    // eslint-disable-next-line no-console
    console.log(DONE_TOKEN, JSON.stringify({
        memory: process.memoryUsage()
    }))
).catch(err =>
    // eslint-disable-next-line no-console
    console.log(ERR_TOKEN, err)
);
