import util from 'util';
import uuidV4 from 'uuid/v4';

import {
    del,
    expire,
    hdel,
    hget,
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
    zremrangebylex
} from './redisApi';

const Z_VALUE_SEPARATOR = `${String.fromCharCode(0x0)}${String.fromCharCode(0x0)}`;
const Z_LEX_MAX_VALUE = String.fromCharCode(0xff);
const TTL_FOR_TEMP_COLLECTION = 60;

const getDocument = async ({ client }, collectionName, id) =>
    await hget(client, collectionName, id);

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

const populateNumberIndex = async (client, collectionName, score, id) => {
    await zadd(client, collectionName, score, id);
};

const populateStringIndex = async (client, collectionName, value, id) => {
    await zadd(client, collectionName, 0, `${value}${Z_VALUE_SEPARATOR}${id}`);
};

const updateIndex = async (
    { client, metaCollection },
    collectionName,
    id,
    document,
    { fieldName, fieldType }
) => {
    const indexCollectionName = metaCollection.getIndexName(collectionName, fieldName);
    const value = document[fieldName];
    if (fieldType === 'number') {
        if (typeof value !== 'number') {
            throw new Error(
                `Can't update index '${fieldName}' value: Value '${value}' is not number.`
            );
        }
        return populateNumberIndex(client, indexCollectionName, value, id);
    }
    return populateStringIndex(client, indexCollectionName, value, id);
};

const updateIndexes = async (repository, collectionName, id, document) => {
    const { metaCollection } = repository;
    const indexes = await metaCollection.getIndexes(collectionName);
    const promises = Object.keys(indexes).map(async (fieldName) => {
        const index = indexes[fieldName];
        await updateIndex(repository, collectionName, id, document, index);
    });
    await Promise.all(promises);
};

const criteriaIsEmpty = criteria => !(criteria && Object.keys(criteria).length);

const count = async ({ client }, collectionName, criteria) => await hlen(client, collectionName);

const validateSortFields = (indexes, sort) => {
    if (sort) {
        validateIndexes(
            indexes,
            Object.keys(sort),
            'Can\'t find index for \'%s\': you can sort by only indexed field'
        );
    }
};

const find = async (
    repository,
    collectionName,
    criteria,
    { skip = null, limit = null, sort = null }
) => {
    const { client, metaCollection } = repository;
    const indexes = await metaCollection.getIndexes(collectionName);
    validateCriteriaFields(indexes, criteria);
    validateSortFields(indexes, sort);
    if (criteriaIsEmpty(criteria)) {
        return await hvals(client, collectionName);
    }
    const ids = await getIds(repository, collectionName, indexes, criteria);
    // sort
    // get by ids
    // promises = ids.map
    const promises = ids.map(async id => await getDocument(repository, collectionName, id));
    return await Promise.all(promises);
};

const findOne = async (repository, collectionName, criteria, { skip = 0, order = 0 }) => {
    const limit = 1;
    return find(repository, collectionName, criteria, { skip, limit, order });
};

function wrapFind(repository, initialFind, collectionName, expression) {
    const resultPromise = Promise.resolve();
    const requestChain = {
        skip: null,
        limit: null,
        sort: null
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

const removeIdFromIndex = async (
    { client, metaCollection },
    collectionName,
    id,
    document,
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
        const document = await getDocument(repository, collectionName, id);
        const proms = Object.keys(indexes).map(
            async key =>
                await removeIdFromIndex(repository, collectionName, id, document, indexes[key])
        );
        await Promise.all(proms);
    });
    await Promise.all(promises);
};

const removeIds = async (repository, collectionName, indexes, ids) => {
    await removeIdsFromIndexes(repository, collectionName, indexes, ids);
    await hdel(repository.client, collectionName, ...ids);
};

const remove = async (repository, collectionName, criteria) => {
    const { metaCollection } = repository;
    if (!criteria || !Object.keys(criteria).length) {
        return await removeAll(repository, collectionName);
    }

    const indexes = await metaCollection.getIndexes(collectionName);

    const ids = await getIds(repository, collectionName, indexes, criteria);
    await removeIds(repository, collectionName, indexes, ids);
};

const applyDotNotation = async (document, fieldName, fieldOptions, cb) => {
    const fields = fieldName.split('.');
    if (fields.length > 1) {
        fields.reduce((acc, field, currentIndex) => {
            if (fields.length === currentIndex - 1) {
                cb(acc, fieldName, fieldOptions, false);
            }
            return acc[fieldName];
        }, document);
    } else {
        cb(document, fieldName, fieldOptions, true);
    }
};

const applyFields = async (document, options, cb) => {
    const promises = Object.keys(options).map(async fieldName =>
        applyDotNotation(document, fieldName, options[fieldName], cb)
    );
    await Promise.all(promises);
};

const updateHandlers = {
    $unset: async (repository, collectionName, indexes, id, partDoc, fieldName, isRootLevel) => {
        if (isRootLevel) {
            const index = indexes[fieldName];
            if (index) {
                await removeIdFromIndex(repository, collectionName, id, partDoc, index);
            }
        }

        if (Array.isArray(partDoc[fieldName])) {
            partDoc[fieldName] = null;
        } else {
            delete partDoc[fieldName];
        }
    },
    $inc: async (
        repository,
        collectionName,
        indexes,
        id,
        partDoc,
        fieldName,
        isRootLevel,
        fieldOptions
    ) => {
        if (isRootLevel) {
            const index = indexes[fieldName];
            if (index) {
                await removeIdFromIndex(repository, collectionName, id, partDoc, index);
            }
        }

        partDoc[fieldName] += fieldOptions;

        if (isRootLevel) {
            const index = indexes[fieldName];
            if (index) {
                await updateIndex(repository, collectionName, id, document, index);
            }
        }
    },
    $push: async (
        repository,
        collectionName,
        indexes,
        id,
        partDoc,
        fieldName,
        isRootLevel,
        fieldOptions
    ) => {
        if (!Array.isArray(partDoc[fieldName])) {
            throw new Error(`The field '${fieldName}' is not array in document { _id: ${id} }`);
        }
        if (isRootLevel) {
            const index = indexes[fieldName];
            if (index) {
                await removeIdFromIndex(repository, collectionName, id, partDoc, index);
            }
        }
        document[fieldName] = fieldOptions;
        if (isRootLevel) {
            const index = indexes[fieldName];
            if (index) {
                await updateIndex(repository, collectionName, id, document, index);
            }
        }
    },
    $pull: async (repository, collectionName, indexes, id, document, options) => {
        throw new Error('Not implemented!!!');
    }
};

const update = async (repository, collectionName, criteria, operators) => {
    const { client, metaCollection } = repository;
    const indexes = await metaCollection.getIndexes(collectionName);
    const ids = await getIds(repository, collectionName, indexes, criteria);
    ids.forEach(async (id) => {
        const document = await getDocument(repository, collectionName, id);

        const promises = Object.keys(operators).map(async (operatorName) => {
            const handler = updateHandlers[operatorName];
            if (!handler) {
                throw new Error('Invalid update operator');
            }
            const operatorOptions = operators[operatorName];
            await applyFields(
                document,
                operatorOptions,
                (doc, fieldName, fieldOptions, isRootLevel) => {
                    handler(
                        repository,
                        collectionName,
                        indexes,
                        id,
                        doc,
                        fieldName,
                        isRootLevel,
                        fieldOptions
                    );
                }
            );
        });
        await Promise.all(promises);

        await hset(client, collectionName, id, document);
    });
};

const ensureIndex = async (repository, collectionName, { fieldName, fieldType, order = 1 }) => {
    const { metaCollection } = repository;
    if (!fieldName) {
        throw new Error('`ensureIndex` - invalid fieldName');
    }

    if (!(fieldType === 'string' || fieldType === 'number')) {
        throw new Error('`ensureIndex` - invalid fieldType');
    }

    if (!(order === 1 || order === -1)) {
        throw new Error('`ensureIndex` - invalid order type: you can use only 1 or -1');
    }
    if ((await count(repository, collectionName, {})) > 0) {
        throw new Error(
            `Can't create the index by '${fieldName}' field ` +
                `when collection '${collectionName}' have documents`
        );
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
