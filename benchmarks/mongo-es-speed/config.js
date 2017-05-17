export default {
    MONGODB_CONNECTION_URL: process.env.MONGODB_CONNECTION_URL || `mongodb://${process.env.MONGODB_HOST || 'localhost'}:27017/ResolveLoadTest`,
    MONGODB_COLLECTION_NAME: process.env.MONGODB_COLLECTION_NAME || 'EsSpeedEvents',
    GENERATED_EVENT_TYPES: ['Event1Raised', 'Event2Raised', 'Event3Raised', 'Event4Raised', 'Event5Raised', 'Event6Raised', 'Event7Raised'],
    BENCHMARK_SERIES: [0, 10000, 30000, 100000, 300000, 1000000]
};
