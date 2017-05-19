import mongoDbDriver from 'resolve-es-mongo';
import createEs from 'resolve-es';

import config from './config';

const TYPES = config.GENERATED_EVENT_TYPES;
const PAYLOAD_COUNT = config.PAYLOAD_ELEMENTS_COUNT;
const PAYLOAD_SIZE = config.PAYLOAD_ELEMENT_SIZE;

const store = createEs({
    driver: mongoDbDriver({
        url: config.MONGODB_CONNECTION_URL,
        collection: config.MONGODB_COLLECTION_NAME
    })
});

function numericRandom(maxlen) {
    let value = '';
    while (value.length < maxlen) {
        value += String(Math.random()).substring(2, 10);
    }
    return value;
}

function buildPayload() {
    let nameCounter = 0;

    return Array.from(new Array(PAYLOAD_COUNT)).reduce((obj) => {
        const content = `FieldValue${numericRandom(PAYLOAD_SIZE)}`;
        obj[`FieldName${nameCounter++}`] = content;
        return obj;
    }, Object.create(null));
}

export default function (eventsCount, reportObj) {
    let processedEvents = 0;

    return Array.from(new Array(eventsCount)).reduce(
        acc =>
            acc.then(() =>
                store
                    .saveEvent({
                        type: TYPES[Math.floor(Math.random() * TYPES.length)],
                        aggregateId: `GUID${numericRandom(20)}`,
                        payload: buildPayload(),
                        timestamp: Date.now()
                    })
                    .then(() => (++processedEvents % 5000 === 0 ? (reportObj.value += 5000) : null))
            ),
        Promise.resolve()
    );
}
