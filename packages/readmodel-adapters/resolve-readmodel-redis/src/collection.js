import { hlen, hset, hvals, zadd } from './redisApi';

const populateNumberIndex = async (client, collectionName, score, id) => {
    await zadd(client, collectionName, score, `"${id}"` );
};

const populateStringIndex = async (client, collectionName, value, id) => {
    await zadd(client, collectionName, 0, `${value}:${id}`);
};

const updateIndexes = async ({ client, metaCollection }, collectionName, id, document) => {
    const indexes = await metaCollection.getIndexes(collectionName);
    Object.keys(indexes).forEach((key) => {
        const indexCollectionName = metaCollection.getIndexName(collectionName, key);
        const index = indexes[key];
        const value = document[key];
        if (index.fieldType === 'number') {
            if (typeof value !== 'number') {
                throw new Error(`Can't update index '${key}' value: Value '${value}' is not number.`);
            }
            return populateNumberIndex(client, indexCollectionName, value, id);
        }
        return populateStringIndex(client, indexCollectionName, value, id)
    });
};

const criteriaIsEmpty = criteria => !(criteria && Object.keys(criteria).length);

const count = async ({ client }, collectionName, criteria) => await hlen(client, collectionName);

const find = async ({ client }, collectionName, criteria, { skip = 0, limit = 0, order = 0 }) => {
    if (criteriaIsEmpty(criteria)) {
        return await hvals(client, collectionName);
    }
    throw new Error('TODO: implement me!');
    // // todo: do find
    // return cursorInterface(/* todo */)
};

const findOne = async (
    { client },
    collectionName,
    criteria,
    { skip = 0, limit = 0, order = 0 }
) => {
    if (criteriaIsEmpty(criteria)) {
        const vals = await hvals(client, collectionName);
        return;
    }
    throw new Error('TODO: implement me!');
    // todo: do find
    // return cursorInterface(/* todo */)
};

function wrapFind(repository, initialFind, collectionName, expression) {
    const resultPromise = Promise.resolve();
    const requestChain = {
        skip: null,
        limit: null
    };
    const sanitizeError = ''; //sanitizeSearchExpression(expression);

    ['skip', 'limit'].forEach((cmd) => {
        resultPromise[cmd] = (count) => {
            requestChain[cmd] = count;
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

const remove = async (repository, collectionName, criteria) => {
    throw new Error('TODO: implement me!');
};

const update = async ({ client }, collectionName, criteria) => await hset(client, collectionName);

const ensureIndex = async ({ metaCollection }, collectionName, { fieldName, fieldType, order = 1 }) => {
    if(!fieldName) {
        throw new Error('`ensureIndex` - invalid fieldName');
    }

    if(!(fieldType === 'string' || fieldType === 'number')) {
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
