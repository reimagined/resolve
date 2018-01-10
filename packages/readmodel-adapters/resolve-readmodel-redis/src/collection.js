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
    zrevrange,
    zrangebylex,
    zrangebyscore,
    zrem,
    zremrangebylex
} from './redisApi';
import { normalize } from 'path';

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

const normalizeIndexValues = (fieldType, values) =>
    fieldType === 'number'
        ? values
        : values.map(value =>
              value.substr(value.lastIndexOf(Z_VALUE_SEPARATOR) + Z_VALUE_SEPARATOR.length)
          );

const getIds = async (repository, collectionName, indexes, criteria) => {
    const { client, metaCollection } = repository;

    validateCriteriaFields(indexes, criteria);
    const tempPrefix = uuidV4();
    const tempCollectionNames = {};

    // todo extract function
    const promises = Object.keys(criteria).map(async (fieldName) => {
        tempCollectionNames[fieldName] = `${tempPrefix}_${fieldName}`;
        const fieldValue = criteria[fieldName];
        const indexName = metaCollection.getFindIndexName(collectionName, fieldName);
        const fieldType = indexes[fieldName].fieldType;

        let ids =
            fieldType === 'number'
                ? await zrangebyscore(client, indexName, fieldValue, fieldValue)
                : await zrangebylex(
                      client,
                      indexName,
                      `[${fieldValue}${Z_VALUE_SEPARATOR}`,
                      `(${fieldValue}${Z_VALUE_SEPARATOR}${Z_LEX_MAX_VALUE}`
                  );
        ids = normalizeIndexValues(fieldType, ids);
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

const populateFindIndex = async (
    client,
    collectionName,
    fieldName,
    fieldType,
    indexName,
    id,
    value
) => {
    if (fieldType === 'number') {
        if (typeof value !== 'number') {
            throw new Error(
                `Can't update index '${fieldName}' value: Value '${value}' is not number.`
            );
        }
        await populateNumberIndex(client, indexName, value, id);
    } else {
        await populateStringIndex(client, indexName, value, id);
    }
};

const populateSortIndex = async (client, collectionName, value, id) => {
    await hset(client, collectionName, id, value);
};

const updateIndex = async (
    { client, metaCollection },
    collectionName,
    id,
    document,
    { fieldName, fieldType }
) => {
    const value = document[fieldName];

    const findIndexName = metaCollection.getFindIndexName(collectionName, fieldName);
    await populateFindIndex(client, collectionName, fieldName, fieldType, findIndexName, id, value);

    const sortIndexName = metaCollection.getSortIndexName(collectionName, fieldName);
    await populateSortIndex(client, sortIndexName, value, id);
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
        const fieldNames = Object.keys(sort);
        if (fieldNames.length > 1) {
            throw new Error('You can sort by only one field');
        }
        validateIndexes(
            indexes,
            fieldNames,
            'Can\'t find index for \'%s\': you can sort by only indexed field'
        );
    }
};

const find = async (
    repository,
    collectionName,
    criteria,
    { skip = 0, limit = -1, sort = null }
) => {
    const { client, metaCollection } = repository;
    const indexes = await metaCollection.getIndexes(collectionName);
    validateCriteriaFields(indexes, criteria);
    validateSortFields(indexes, sort);
    let ids;
    if (criteriaIsEmpty(criteria)) {
        const indexName = metaCollection.getFindIndexName(collectionName, '_id');
        ids = await zrange(client, indexName);
    } else {
        ids = await getIds(repository, collectionName, indexes, criteria);
    }

    if (sort) {
        const sortField = Object.keys(sort)[0];
        const order = sort[sortField];
        const { fieldType } = indexes[sortField];
        const sortIndexName = metaCollection.getSortIndexName(collectionName, sortField);

        const tempSortTable = uuidV4();

        const promises = ids.map(async (id) => {
            const value = await hget(client, sortIndexName, id);
            await populateFindIndex(
                client,
                collectionName,
                sortField,
                fieldType,
                tempSortTable,
                id,
                value
            );
        });
        await Promise.all(promises);
        await expire(client, tempSortTable, TTL_FOR_TEMP_COLLECTION);
        const stop = limit === -1 ? -1 : skip + limit - 1;
        ids =
            order === 1
                ? await zrange(client, tempSortTable, skip, stop)
                : await zrevrange(client, tempSortTable, skip, stop);

        del(client, tempSortTable);
        ids = normalizeIndexValues(fieldType, ids);
    } else {
        const end = limit === -1 ? undefined : skip + limit;
        ids = ids.slice(skip, end);
    }
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
        // skip: null,
        // limit: null,
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

        const findIndexName = metaCollection.getFindIndexName(collectionName, fieldName);
        await del(client, findIndexName);

        const sortIndexName = metaCollection.getSortIndexName(collectionName, fieldName);
        await del(client, sortIndexName);
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
    const findIndexName = metaCollection.getFindIndexName(collectionName, fieldName);
    if (fieldType === 'number') {
        await zrem(client, findIndexName, id);
    } else {
        const fieldValue = document[fieldName];
        await zremrangebylex(
            client,
            findIndexName,
            `[${fieldValue}${Z_VALUE_SEPARATOR}${id}`,
            `(${fieldValue}${Z_VALUE_SEPARATOR}${id}`
        );
    }

    await hdel(client, metaCollection.getSortIndexName(collectionName, fieldName));
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

const createIndex = async (repository, collectionName, { fieldName, fieldType, order = 1 }) => {
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

const ensureIndex = async (repository, collectionName, options) => {
    const { metaCollection } = repository;
    const { fieldName, fieldType, order = 1 } = options;

    const indexes = metaCollection.getIndexes(collectionName);
    if (indexes && indexes[fieldName]) {
        const idx = indexes[fieldName];
        if (idx.fieldName !== fieldName || idx.fieldType !== fieldType || idx.order !== order) {
            throw new Error(
                `Collection '${collectionName}' has index by '${fieldName}' field ` +
                    'but fieldType or order is different'
            );
        }
    }
    return createIndex(repository, collectionName, options);
};

const removeIndex = async ({ client, metaCollection }, collectionName, fieldName) => {
    await metaCollection.removeIndex(collectionName, fieldName);
    await del(client, metaCollection.getFindIndexName(collectionName, fieldName));
    await del(client, metaCollection.getSortIndexName(collectionName, fieldName));
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
