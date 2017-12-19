import { hincrby, hget, hdel, hexists, hset } from './redisApi';

const create = async (
    { client, metaCollectionName, autoincMetaCollectionName },
    collectionName
) => {
    await hset(client, metaCollectionName, collectionName, { lastTimestamp: 0 });
    await hset(client, autoincMetaCollectionName, collectionName, 0);
};

const del = async ({ client, metaCollectionName, autoincMetaCollectionName }, collectionName) => {
    await hdel(client, metaCollectionName, collectionName);
    await hdel(client, metaCollectionName, autoincMetaCollectionName);
};

const exists = async ({ client, metaCollectionName, autoincMetaCollectionName }, collectionName) =>
    await hexists(client, metaCollectionName, collectionName);

const get = async ({ client, metaCollectionName, autoincMetaCollectionName }, collectionName) =>
    await hget(client, metaCollectionName, collectionName);

const getNextId = async ({ client, autoincMetaCollectionName }, collectionName) =>
    await hincrby(client, autoincMetaCollectionName, collectionName, 1);

export default (repository) => {
    return Object.freeze({
        create: create.bind(null, repository),
        del: del.bind(null, repository),
        exists: exists.bind(null, repository),
        get: get.bind(null, repository),
        getNextId: getNextId.bind(null, repository)
    });
};
