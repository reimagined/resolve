import { hincrby, hget, hdel, hexists, hset } from './redisApi';

const DEFAULT_META = { lastTimestamp: 0, indexes: {} };

const create = async (
    { client, metaCollectionName, autoincMetaCollectionName },
    collectionName
) => {
    await hset(client, metaCollectionName, collectionName, DEFAULT_META);
    await hset(client, autoincMetaCollectionName, collectionName, 0);
};

const del = async ({ client, metaCollectionName, autoincMetaCollectionName }, collectionName) => {
    await hdel(client, metaCollectionName, collectionName);
    await hdel(client, autoincMetaCollectionName, collectionName);
};

const exists = async ({ client, metaCollectionName }, collectionName) =>
    await hexists(client, metaCollectionName, collectionName);

const get = async ({ client, metaCollectionName }, collectionName) =>
    await hget(client, metaCollectionName, collectionName);

const set = async ({ client, metaCollectionName }, collectionName, meta) =>
    await hset(client, metaCollectionName, collectionName, meta);

const getNextId = async ({ client, autoincMetaCollectionName }, collectionName) =>
    parseInt(await hincrby(client, autoincMetaCollectionName, collectionName, 1), 10);

const getFindIndexName = (collectionName, fieldName) => {
    return `${collectionName}__find_index__${fieldName}`;
};

const getSortIndexName = (collectionName, fieldName) => {
    return `${collectionName}__sort_index__${fieldName}`;
};

const ensureIndex = async (repository, collectionName, { fieldName, fieldType, order }) => {
    const meta = await get(repository, collectionName);

    if (meta.indexes[fieldName]) {
        throw new Error(`Can't 'ensureIndex': '${fieldName}' is exists`);
    }

    meta.indexes[fieldName] = {
        fieldName,
        fieldType,
        order
    };

    await set(repository, collectionName, meta);
};

const removeIndex = async (repository, collectionName, fieldName) => {
    const meta = await get(repository, collectionName);

    if (!meta.indexes[fieldName]) {
        throw new Error(`Can't 'removeIndex': '${fieldName}' is not exists`);
    }
    delete meta.indexes[fieldName];

    await set(repository, collectionName, meta);
};

const getIndexes = async ({ client, metaCollectionName }, collectionName) => {
    const meta = await hget(client, metaCollectionName, collectionName);
    return !meta ? DEFAULT_META.indexes : meta.indexes;
};

export default (repository) => {
    return Object.freeze({
        create: create.bind(null, repository),
        del: del.bind(null, repository),
        exists: exists.bind(null, repository),
        get: get.bind(null, repository),
        getFindIndexName: getFindIndexName,
        getSortIndexName: getSortIndexName,
        getNextId: getNextId.bind(null, repository),
        ensureIndex: ensureIndex.bind(null, repository),
        removeIndex: removeIndex.bind(null, repository),
        getIndexes: getIndexes.bind(null, repository)
    });
};
