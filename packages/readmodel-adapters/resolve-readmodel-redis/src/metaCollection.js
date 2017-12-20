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
    await hincrby(client, autoincMetaCollectionName, collectionName, 1);

const getIndexName = (collectionName, fieldName) => {
    return `${collectionName}__index__${fieldName}`;
};

const ensureIndex = async (repository, collectionName, { fieldName, fieldType, order }) => {
    const meta = await get(repository, collectionName);

    const name = getIndexName(collectionName, fieldName);
    if (meta.indexes[fieldName]) {
        throw new Error(`Can't 'ensureIndex': '${name}' is exists`);
    }
    meta.indexes[fieldName] = {
        fieldType,
        order
    };

    await set(repository, collectionName, meta);
};

const removeIndex = async (repository, collectionName, fieldName) => {
    const meta = await get(repository, collectionName);

    if (!meta.indexes[fieldName]) {
        throw new Error(`Can't 'removeIndex': '${name}' is not exists`);
    }
    delete meta.indexes[fieldName];

    await set(repository, collectionName, meta);
};

const getIndexes = async (repository, collectionName) => {
    const meta = await get(repository, collectionName);
    return meta.indexes;
}

export default (repository) => {
    return Object.freeze({
        create: create.bind(null, repository),
        del: del.bind(null, repository),
        exists: exists.bind(null, repository),
        get: get.bind(null, repository),
        getIndexName: getIndexName,
        getNextId: getNextId.bind(null, repository),
        ensureIndex: ensureIndex.bind(null, repository),
        removeIndex: removeIndex.bind(null, repository),
        getIndexes: getIndexes.bind(null, repository)
    });
};
