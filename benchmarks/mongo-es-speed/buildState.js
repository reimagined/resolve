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
const ERR_TOKEN = '-------ERR-------';

store.loadEventsByTypes(TYPES, () => null).then(() =>
    // eslint-disable-next-line no-console
    console.log(DONE_TOKEN, JSON.stringify({
        memory: process.memoryUsage()
    }))
).catch(err =>
    // eslint-disable-next-line no-console
    console.log(ERR_TOKEN, err)
);
