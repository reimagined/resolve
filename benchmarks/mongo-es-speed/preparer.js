import { dropCollection } from 'benchmark-base/tools';
import mongoDbAdapter from 'resolve-storage-mongo';
import config from './config';

const TYPES = config.GENERATED_EVENT_TYPES;
const PAYLOAD_COUNT = config.PAYLOAD_ELEMENTS_COUNT;
const PAYLOAD_SIZE = config.PAYLOAD_ELEMENT_SIZE;

function numericRandom(maxlen) {
    let value = '';
    while (value.length < maxlen) {
        value += String(Math.random()).substring(2, 10);
    }
    return value;
}

function buildPayload(payloadCount, payloadSize) {
    let nameCounter = 0;

    return Array.from(new Array(payloadCount)).reduce((obj) => {
        const content = `FieldValue${numericRandom(payloadSize)}`;
        obj[`FieldName${nameCounter++}`] = content;
        return obj;
    }, Object.create(null));
}

function generateEvents(saveEvent, eventsCount, reportObj) {
    let processedEvents = 0;

    return Array.from(new Array(eventsCount)).reduce(
        acc =>
            acc.then(() =>
                saveEvent({
                    type: TYPES[Math.floor(Math.random() * TYPES.length)],
                    aggregateId: `GUID${numericRandom(20)}`,
                    payload: buildPayload(PAYLOAD_COUNT, PAYLOAD_SIZE),
                    timestamp: Date.now()
                }).then(() => (++processedEvents % 5000 === 0 ? (reportObj.value += 5000) : null))
            ),
        Promise.resolve()
    );
}

export default function preparer(eventsCount, reportObj) {
    const storage = mongoDbAdapter({
        url: config.MONGODB_CONNECTION_URL,
        collection: config.MONGODB_COLLECTION_NAME
    });

    return dropCollection(config.MONGODB_CONNECTION_URL, config.MONGODB_COLLECTION_NAME).then(() =>
        generateEvents(storage.saveEvent.bind(storage), eventsCount, reportObj)
    );
}
