import util from 'util';
import uuidV4 from 'uuid/v4';
import {
    del,
    expire,
    hdel,
    hlen,
    hset,
    hvals,
    zadd,
    zaddMulti,
    zinterstore,
    zrange,
    zrangebylex,
    zrangebyscore,
    zrem,
    zremrangebylex,
    hget
} from './redisApi';

const Z_VALUE_SEPARATOR = `${String.fromCharCode(0x0)}${String.fromCharCode(0x0)}`;
const Z_LEX_MAX_VALUE = String.fromCharCode(0xff);
const TTL_FOR_TEMP_COLLECTION = 60;

const populateNumberIndex = async (client, collectionName, score, id) => {
    await zadd(client, collectionName, score, id);
};

const populateStringIndex = async (client, collectionName, value, id) => {
    await zadd(client, collectionName, 0, `${value}${Z_VALUE_SEPARATOR}${id}`);
};

const updateIndexes = async ({ client, metaCollection }, collectionName, id, document) => {
    const indexes = await metaCollection.getIndexes(collectionName);
    Object.keys(indexes).forEach((key) => {
        const indexCollectionName = metaCollection.getIndexName(collectionName, key);
        const index = indexes[key];
        const value = document[key];
        if (index.fieldType === 'number') {
            if (typeof value !== 'number') {
                throw new Error(
                    `Can't update index '${key}' value: Value '${value}' is not number.`
                );
            }
            return populateNumberIndex(client, indexCollectionName, value, id);
        }
        return populateStringIndex(client, indexCollectionName, value, id);
    });
};

const removeIndexes = async ({ client, metaCollection }, collectionName, criteria) => {};

const criteriaIsEmpty = criteria => !(criteria && Object.keys(criteria).length);

const count = async ({ client }, collectionName, criteria) => await hlen(client, collectionName);

const validateIndexes = (indexes, fieldNames, errorMessage) => {
    fieldNames.forEach((field) => {
        if (!indexes[field]) {
            throw new Error(util.format(errorMessage, field));
        }
    });
};

const validateCriteriaFields = (indexes, criteria) => {
    if (criteria) {
        validateIndexes(
            indexes,
            Object.keys(criteria),
            'Can\'t find index for \'%s\': you can find by only indexed field'
        );
    }
};

const validateSortFields = (indexes, sort) => {
    if (!sort) {
        validateIndexes(
            indexes,
            Object.keys(sort),
            'Can\'t find index for \'%s\': you can sort by only indexed field'
        );
    }
};

const find = async (
    { client, metaCollection },
    collectionName,
    criteria,
    { skip = null, limit = null, sort = null }
) => {
    const indexes = await metaCollection.getIndexes(collectionName);
    validateCriteriaFields(indexes, criteria);
    validateSortFields(indexes, sort);

    if (criteriaIsEmpty(criteria)) {
        return await hvals(client, collectionName);
    }

    throw new Error('TODO: implement me!');
    // // todo: do find
    // return cursorInterface(/* todo */)
};

const findOne = async (repository, collectionName, criteria, { skip = 0, order = 0 }) => {
    const limit = 1;
    return find(repository, collectionName, criteria, { skip, limit, order });
};

function wrapFind(repository, initialFind, collectionName, expression) {
    const resultPromise = Promise.resolve();
    const requestChain = {
        skip: null,
        limit: null
    };
    const sanitizeError = ''; //sanitizeSearchExpression(expression);

    ['skip', 'limit', 'sort'].forEach((cmd) => {
        resultPromise[cmd] = (value) => {
            requestChain[cmd] = value;
            return resultPromise;
        };
    });

    const originalThen = resultPromise.then.bind(resultPromise);
    const boundExecFind = (!sanitizeError
        ? initialFind
        : Promise.reject.bind(Promise, new Error(sanitizeError))
    ).bind(null, repository, collectionName, expression, requestChain);

    resultPromise.then = (...continuation) => originalThen(boundExecFind).then(...continuation);

    resultPromise.catch = (...continuation) => originalThen(boundExecFind).catch(...continuation);

    return resultPromise;
}

const insert = async (repository, collectionName, document) => {
    const { client, metaCollection } = repository;
    const _id = await metaCollection.getNextId(collectionName);
    const member = { _id, ...document };
    await hset(client, collectionName, _id, member);
    await updateIndexes(repository, collectionName, _id, member);
};

const removeAll = async ({ client, metaCollection }, collectionName) => {
    const indexes = await metaCollection.getIndexes(collectionName);
    Object.keys(indexes).forEach(async (key) => {
        const { fieldName } = indexes[key];
        const indexCollectionName = metaCollection.getIndexName(collectionName, fieldName);
        await del(client, indexCollectionName);
    });
    await del(client, collectionName);
};

const saveIdsToCollection = async ({ client }, collectionName, ids) => {
    const args = ids.reduce(
        (acc, id) => {
            // score
            acc.push(id);
            // value
            acc.push(id);
            return acc;
        },
        [collectionName]
    );
    await zaddMulti(client, args);
    await expire(client, collectionName, TTL_FOR_TEMP_COLLECTION);
};

const getIds = async (repository, collectionName, indexes, criteria) => {
    const { client, metaCollection } = repository;

    validateCriteriaFields(indexes, criteria);
    const tempPrefix = uuidV4();
    const tempCollectionNames = {};

    // todo extract function
    const promises = Object.keys(criteria).map(async (fieldName) => {
        tempCollectionNames[fieldName] = `${tempPrefix}_${fieldName}`;
        const fieldValue = criteria[fieldName];
        const indexName = metaCollection.getIndexName(collectionName, fieldName);
        const fieldType = indexes[fieldName].fieldType;

        let ids = [];
        if (fieldType === 'number') {
            ids = await zrangebyscore(client, indexName, fieldValue, fieldValue);
        } else {
            const lexIds = await zrangebylex(
                client,
                indexName,
                `[${fieldValue}${Z_VALUE_SEPARATOR}`,
                `(${fieldValue}${Z_VALUE_SEPARATOR}${Z_LEX_MAX_VALUE}`
            );
            ids = lexIds.map(value =>
                value.substr(value.lastIndexOf(Z_VALUE_SEPARATOR) + Z_VALUE_SEPARATOR.length)
            );
        }
        return await saveIdsToCollection(repository, tempCollectionNames[fieldName], ids);
    });

    await Promise.all(promises);

    const keys = Object.values(tempCollectionNames);
    await zinterstore(client, tempPrefix, keys.length, keys);
    await expire(client, tempPrefix, TTL_FOR_TEMP_COLLECTION);

    const result = await zrange(client, tempPrefix);

    // cleanup
    await del(client, ...keys.concat(tempPrefix));

    return result;
};

const getDocument = async (client, collectionName, id) =>
    await hget(client, collectionName, id);

const removeIdFromIndex = async (
    { client, metaCollection },
    collectionName,
    document,
    id,
    index
) => {
    const { fieldName, fieldType } = index;
    const indexCollectionName = metaCollection.getIndexName(collectionName, fieldName);
    if (fieldType === 'number') {
        return await zrem(client, indexCollectionName, id);
    }
    const fieldValue = document[fieldName];

    await zremrangebylex(
        client,
        indexCollectionName,
        `[${fieldValue}${Z_VALUE_SEPARATOR}${id}`,
        `(${fieldValue}${Z_VALUE_SEPARATOR}${id}`
    );
};

const removeIdsFromIndexes = async (repository, collectionName, indexes, ids) => {
    const promises = ids.map(async (id) => {
        const document = await getDocument(repository.client, collectionName, id);
        const proms = Object.keys(indexes).map(async key =>
                await removeIdFromIndex(repository, collectionName, document, id, indexes[key]));
        await Promise.all(proms);
    });
    await Promise.all(promises);
};

const remove = async (repository, collectionName, criteria) => {
    const { client, metaCollection } = repository;
    if (!criteria || !Object.keys(criteria).length) {
        return await removeAll(repository, collectionName);
    }

    const indexes = await metaCollection.getIndexes(collectionName);

    const ids = await getIds(repository, collectionName, indexes, criteria);
    await removeIdsFromIndexes(repository, collectionName, indexes, ids);
    await hdel(client, collectionName, ...ids);
};

const update = async ({ client }, collectionName, criteria) => await hset(client, collectionName);

const ensureIndex = async (
    { metaCollection },
    collectionName,
    { fieldName, fieldType, order = 1 }
) => {
    if (!fieldName) {
        throw new Error('`ensureIndex` - invalid fieldName');
    }

    if (!(fieldType === 'string' || fieldType === 'number')) {
        throw new Error('`ensureIndex` - invalid fieldType');
    }

    if (!(order === 1 || order === -1)) {
        throw new Error('`ensureIndex` - invalid order type: you can use only 1 or -1');
    }

    await metaCollection.ensureIndex(collectionName, { fieldName, fieldType, order });
};

const removeIndex = async ({ metaCollection }, collectionName, field) => {
    await metaCollection.removeIndex(collectionName, field);
};

const collection = (repository, collectionName) => {
    return Object.freeze({
        count: count.bind(null, repository, collectionName),
        find: wrapFind.bind(null, repository, find, collectionName),
        findOne: wrapFind.bind(null, repository, findOne, collectionName),
        insert: insert.bind(null, repository, collectionName),
        remove: remove.bind(null, repository, collectionName),
        update: update.bind(null, repository, collectionName),

        ensureIndex: ensureIndex.bind(null, repository, collectionName),
        removeIndex: removeIndex.bind(null, repository, collectionName)

        // promise
        // then: array => {},
        // catch: () => {}
    });
};

export default collection;
