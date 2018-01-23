import 'regenerator-runtime/runtime';
import redis from 'redis';

import buildProjection from './build_projection';
import init from './init';
import reset from './reset';

const DEFAULT_META_COLLECTION_NAME = '__ResolveMetaCollection__';
const DEFAULT_AUTOINC_META_COLLECTION_NAME = '__ResolveMetaCollectionAutoinc__';
const DEFAULT_LAST_TIMESTAMP_COLLECTION_NAME = '__ResolveMetaCollectionLastTimestamp__';

export default function createRedisAdapter(
    options,
    { metaCollectionName, autoincMetaCollectionName, lastTimestampCollectionName },
    redisClient
) {
    const repository = Object.create(null);

    repository.metaCollectionName =
        metaCollectionName && metaCollectionName.constructor === String
            ? metaCollectionName
            : DEFAULT_META_COLLECTION_NAME;

    repository.autoincMetaCollectionName =
        autoincMetaCollectionName && autoincMetaCollectionName.constructor === String
            ? autoincMetaCollectionName
            : DEFAULT_AUTOINC_META_COLLECTION_NAME;

    repository.lastTimestampCollectionName =
        lastTimestampCollectionName && lastTimestampCollectionName.constructor === String
            ? lastTimestampCollectionName
            : DEFAULT_LAST_TIMESTAMP_COLLECTION_NAME;

    repository.connectDatabase = async options =>
        redisClient ? redisClient : redis.createClient(options instanceof Object ? options : {});

    return Object.create(null, {
        buildProjection: {
            value: buildProjection.bind(null, repository)
        },
        init: {
            value: init.bind(null, repository)
        },
        reset: {
            value: reset.bind(null, repository)
        }
    });
}
