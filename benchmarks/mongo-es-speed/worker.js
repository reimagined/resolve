import mongoDbDriver from 'resolve-es-mongo';
import createEs from 'resolve-es';

import config from './config';

const TYPES = config.GENERATED_EVENT_TYPES;

export default function worker(eventsCount, reportObj) {
    const store = createEs({
        driver: mongoDbDriver({
            url: config.MONGODB_CONNECTION_URL,
            collection: config.MONGODB_COLLECTION_NAME
        })
    });

    return store.loadEventsByTypes(TYPES, () =>
        reportObj.value++
    );
}
