const MONGODB_HOST = process.env.MONGODB_HOST || 'localhost';

const MONGODB_CONNECTION_URL =
    process.env.MONGODB_CONNECTION_URL || `mongodb://${MONGODB_HOST}:27017/ResolveLoadTest`;

const MONGODB_COLLECTION_NAME = process.env.MONGODB_COLLECTION_NAME || 'EsSpeedEvents';

const BENCHMARK_SERIES = [0, 10000, 30000, 100000, 300000, 1000000];

const GENERATED_EVENT_TYPES = [
    'Event1Raised',
    'Event2Raised',
    'Event3Raised',
    'Event4Raised',
    'Event5Raised',
    'Event6Raised',
    'Event7Raised'
];

const PAYLOAD_ELEMENTS_COUNT = 3;
const PAYLOAD_ELEMENT_SIZE = 100;

export default {
    PAYLOAD_ELEMENTS_COUNT,
    PAYLOAD_ELEMENT_SIZE,
    MONGODB_CONNECTION_URL,
    MONGODB_COLLECTION_NAME,
    GENERATED_EVENT_TYPES,
    BENCHMARK_SERIES
};
