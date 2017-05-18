import mongoDbDriver from 'resolve-es-mongo';
import createEs from 'resolve-es';

import config from './config';

const TYPES = config.GENERATED_EVENT_TYPES;

const store = createEs({ driver: mongoDbDriver({
    url: config.MONGODB_CONNECTION_URL,
    collection: config.MONGODB_COLLECTION_NAME
}) });

function numericRandom(maxlen) {
    let value = '';
    while (value.length < maxlen) {
        value += String(Math.random()).substring(2, 10);
    }
    return value;
}

export default function (eventsCount, reportObj) {
    let processedEvents = 0;

    return (new Array(eventsCount)).reduce(
        acc => acc.then(() =>
            store.saveEvent({
                type: TYPES[Math.floor(Math.random() * TYPES.length)],
                aggregateId: `GUID${numericRandom(20)}`,
                payload: {
                    FieldName1: `FieldValue${numericRandom(1000)}`,
                    FieldName2: `FieldValue${numericRandom(1000)}`,
                    FieldName3: `FieldValue${numericRandom(1000)}`
                }
            }).then(() => ((++processedEvents % 5000 === 0)
                ? (reportObj.value += 5000)
                : null
            ))
        ),
        Promise.resolve()
    );
}

