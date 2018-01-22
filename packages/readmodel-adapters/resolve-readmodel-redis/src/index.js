import 'regenerator-runtime/runtime';
import redis from 'redis';

import buildProjection from './build_projection';
import init from './init';
import reset from './reset';

const DEFAULT_META_NAME = '__ResolveMeta__';
const DEFAULT_LAST_TIMESTAMP_KEY = '__ResolveLastTimestampKey__';

const createRedisAdapter = (options, extraOptions) => {
    const { client, metaName, lastTimestampKey } =
        extraOptions instanceof Object ? extraOptions : {};
    const repository = Object.create(null);

    repository.metaName =
        metaName && metaName.constructor === String ? metaName : DEFAULT_META_NAME;

    repository.lastTimestampKey =
        lastTimestampKey && lastTimestampKey.constructor === String
            ? lastTimestampKey
            : DEFAULT_LAST_TIMESTAMP_KEY;

    repository.connectDatabase = async options =>
        client ? client : redis.createClient(options instanceof Object ? options : {});

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
};

export default createRedisAdapter;
