import 'regenerator-runtime/runtime';

import messages from './messages';

async function getCollection(repository, collectionName) {
    await repository.connectionPromise;
    return repository.collectionMap.get(collectionName);
}

async function getMetaCollection(repository) {
    return await getCollection(repository, repository.metaCollectionName);
}

async function getCollectionIndexes(repository, collectionName) {
    const metaCollection = await getMetaCollection(repository);
    const collectionDescriptor = await metaCollection.findOne({ collectionName });
    let indexes = [];

    if (collectionDescriptor && Array.isArray(collectionDescriptor.indexes)) {
        indexes = collectionDescriptor.indexes;
    }

    return indexes;
}

async function syncronizeDatabase(repository, database) {
    repository.collectionMap = new Map();
    const metaCollection = await database.collection(repository.metaCollectionName);
    repository.collectionMap.set(repository.metaCollectionName, metaCollection);

    const collectionDescriptors = await metaCollection.find({}).toArray();
    for (const { collectionName, lastTimestamp } of collectionDescriptors) {
        repository.lastTimestamp = Math.max(repository.lastTimestamp, lastTimestamp);
        const collection = await database.collection(collectionName);
        repository.collectionMap.set(collectionName, collection);
    }

    return database;
}

async function createCollection(repository, collectionName) {
    const database = await repository.connectionPromise;

    if ((await database.listCollections({ name: collectionName }).toArray()).length > 0) {
        throw new Error(messages.collectionExistsNoMeta(collectionName));
    }

    const collection = await database.collection(collectionName);
    repository.collectionMap.set(collectionName, collection);

    const metaCollection = await getMetaCollection(repository);
    await metaCollection.update(
        { collectionName },
        {
            collectionName,
            lastTimestamp: 0,
            indexes: []
        },
        { upsert: true }
    );
}

function checkOptionShape(option, types, count) {
    return !(
        option === null ||
        option === undefined ||
        !types.reduce((acc, type) => acc || option.constructor === type, false) ||
        (option.constructor === Object &&
            (Number.isInteger(count) && Object.keys(option).length !== count))
    );
}

function sanitizeSearchExpression(searchExpression) {
    if (!checkOptionShape(searchExpression, [Object])) {
        return messages.searchExpressionOnlyObject;
    }
    for (let key of Object.keys(searchExpression)) {
        if (!checkOptionShape(searchExpression[key], [Number, String])) {
            return messages.searchExpressionValuesOnlyPrimitive;
        }
    }

    return null;
}

function sanitizeUpdateExpression(updateExpression) {
    if (!checkOptionShape(updateExpression, [Object])) {
        return messages.updateExpressionOnlyObject;
    }

    const allowedOperators = ['$set', '$unset', '$inc', '$push', '$pull'];
    for (let key of Object.keys(updateExpression)) {
        if (key.indexOf('$') > -1 && !allowedOperators.includes(key)) {
            return messages.updateOperatorFixedSet(key);
        }
    }

    return null;
}

function sanitizeIndexExpression(indexExpression) {
    if (
        !checkOptionShape(indexExpression, [Object], 1) ||
        Math.abs(parseInt(Object.values(indexExpression)[0], 10)) !== 1
    ) {
        return messages.indexDescriptorShape;
    }

    return null;
}

async function applyEnsureIndex(collection, metaCollection, collectionName, indexDescriptor) {
    const sanitizeError = sanitizeIndexExpression(indexDescriptor);
    if (sanitizeError) {
        throw new Error(sanitizeError);
    }

    const indexName = Object.keys(indexDescriptor)[0];
    await collection.createIndex(indexDescriptor, { name: indexName });

    await metaCollection.update({ collectionName }, { $push: { indexes: indexName } });
}

async function applyRemoveIndex(collection, metaCollection, collectionName, indexName) {
    if (!checkOptionShape(indexName, [String])) {
        throw new Error(messages.deleteIndexArgumentShape);
    }

    await collection.dropIndex(indexName);
    await metaCollection.update({ collectionName }, { $pull: { indexes: indexName } });
}

function sanitizeUpdateOrDelete(operation, indexList, searchExpression, updateExpression) {
    const sanitizeErrors = [
        sanitizeSearchExpression(searchExpression),
        operation === 'update' ? sanitizeUpdateExpression(updateExpression) : null
    ].filter(error => error !== null);

    if (sanitizeErrors.length > 0) {
        throw new Error(messages.modifyOperationForbiddenPattern(operation, sanitizeErrors));
    }

    for (let key of Object.keys(searchExpression)) {
        if (indexList.indexOf(key) < 0) {
            throw new Error(messages.mofidyOperationOnlyIndexedFiels(operation, key));
        }
    }
}

async function wrapWriteFunction(operation, collectionName, repository, ...args) {
    const collection = await getCollection(repository, collectionName, true);
    const metaCollection = await getMetaCollection(repository);

    if (
        (operation !== 'update' && args.length > 1) ||
        (operation === 'update' && args.length > 2)
    ) {
        throw new Error(messages.mofidyOperationNoOptions(operation));
    }

    await metaCollection.update(
        { collectionName },
        { $set: { lastTimestamp: repository.lastTimestamp } }
    );

    switch (operation) {
        case 'ensureIndex':
            await applyEnsureIndex(collection, metaCollection, collectionName, args[0]);
            break;

        case 'removeIndex':
            await applyRemoveIndex(collection, metaCollection, collectionName, args[0]);
            break;

        case 'update':
        case 'remove':
            sanitizeUpdateOrDelete(
                operation,
                await getCollectionIndexes(repository, collectionName),
                args[0],
                args[1]
            );
        // fallsthrough

        default:
            await collection[operation](...args);
            break;
    }
}

async function execFind(options) {
    const collection = await getCollection(options.repository, options.collectionName);

    if (options.requestFold) {
        throw new Error(messages.findOperationNoReuse);
    }

    const foundErrors = options.foundErrors.filter(value => value !== null);
    if (foundErrors.length > 0) {
        throw new Error(foundErrors.join(', '));
    }

    const searchFields = Object.keys(options.requestChain[0].args);
    const indexesFields = await getCollectionIndexes(options.repository, options.collectionName);

    if (!searchFields.reduce((acc, val) => acc && indexesFields.includes(val), true)) {
        throw new Error(messages.searchOnlyIndexedFields);
    }

    if (options.requestChain[1] && options.requestChain[1].type === 'sort') {
        const indexExpression = Object.keys(options.requestChain[1].args);
        if (!indexExpression.reduce((acc, val) => acc && indexesFields.includes(val), true)) {
            throw new Error(messages.sortOnlyIndexedFields);
        }
    }

    options.requestFold = options.requestChain.reduce(
        (acc, { type, args }) => acc[type](args),
        collection
    );

    if (typeof options.requestFold.toArray === 'function') {
        return await options.requestFold.toArray();
    }

    return await options.requestFold;
}

function wrapFind(initialFind, repository, collectionName, searchExpression) {
    const resultPromise = Promise.resolve();
    const requestChain = [{ type: initialFind, args: searchExpression }];
    const foundErrors = [sanitizeSearchExpression(searchExpression)];

    ['sort', 'skip', 'limit'].forEach((cmd) => {
        resultPromise[cmd] = (value) => {
            if (cmd === 'sort') {
                foundErrors.push(sanitizeIndexExpression(value));
                if (requestChain.length > 1 || initialFind !== 'find') {
                    foundErrors.push(messages.sortOnlyAfterFind);
                }
            }

            if (requestChain.find(entry => entry.type === cmd)) {
                foundErrors.push(messages.dublicateOperation(cmd));
            }

            requestChain.push({ type: cmd, args: value });
            return resultPromise;
        };
    });

    const originalThen = resultPromise.then.bind(resultPromise);
    const boundExecFind = execFind.bind(null, {
        requestChain,
        collectionName,
        foundErrors,
        repository
    });

    resultPromise.then = (...continuation) => originalThen(boundExecFind).then(...continuation);

    resultPromise.catch = (...continuation) => originalThen(boundExecFind).catch(...continuation);

    return resultPromise;
}

async function countDocuments(repository, collectionName, searchExpression) {
    const collection = await getCollection(repository, collectionName);

    const sanitizeError = sanitizeSearchExpression(searchExpression);
    if (sanitizeError) {
        throw new Error(sanitizeError);
    }

    const searchFields = Object.keys(searchExpression);
    const indexesFields = await getCollectionIndexes(repository, collectionName);

    if (!searchFields.reduce((acc, val) => acc && indexesFields.includes(val), true)) {
        throw new Error(messages.searchOnlyIndexedFields);
    }

    return await collection.count(searchExpression);
}

// Provide interface https://docs.mongodb.com/manual/reference/method/js-collection/
async function getCollectionInterface(repository, isWriteable, collectionName) {
    const collectionKey = `COLLECTION_${collectionName}_${isWriteable}`;
    const interfaceMap = repository.interfaceMap;

    if (interfaceMap.has(collectionKey)) {
        return interfaceMap.get(collectionKey);
    }

    await repository.connectionPromise;
    if (!repository.collectionMap.has(collectionName)) {
        if (!isWriteable) {
            throw new Error(messages.unexistingCollection(collectionName));
        }
        await createCollection(repository, collectionName);
    }

    const collectionIface = {
        findOne: wrapFind.bind(null, 'findOne', repository, collectionName),
        find: wrapFind.bind(null, 'find', repository, collectionName),
        count: countDocuments.bind(null, repository, collectionName)
    };

    Object.assign(
        collectionIface,
        ['insert', 'update', 'remove', 'ensureIndex', 'removeIndex'].reduce((acc, operation) => {
            acc[operation] = (isWriteable
                ? wrapWriteFunction
                : (...args) => {
                    throw new Error(messages.readSideForbiddenOperation(...args));
                }
            ).bind(null, operation, collectionName, repository);
            return acc;
        }, {})
    );

    interfaceMap.set(collectionKey, Object.freeze(collectionIface));
    return interfaceMap.get(collectionKey);
}

async function listCollections(repository) {
    await repository.connectionPromise;

    return Array.from(repository.collectionMap.keys()).filter(
        name => name !== repository.metaCollectionName
    );
}

// Provide interface https://docs.mongodb.com/manual/reference/method/js-database/
function getStoreInterface(repository, isWriteable) {
    return Object.freeze({
        collection: getCollectionInterface.bind(null, repository, isWriteable),
        listCollections: listCollections.bind(null, repository)
    });
}

async function initProjection(repository) {
    await repository.connectionPromise;
    if (repository.lastTimestamp !== 0) return;
    repository.lastTimestamp = 1;

    try {
        await repository.initHandler(repository.writeInterface);
    } catch (error) {
        repository.internalError = error;
    }
}

export default function init(repository) {
    if (repository.interfaceMap) {
        throw new Error(messages.reinitialization);
    }
    repository.lastTimestamp = 0;

    if (typeof repository.initHandler !== 'function') {
        repository.initHandler = async () => {};
    }

    repository.connectionPromise = repository
        .connectDatabase()
        .then(syncronizeDatabase.bind(null, repository));

    repository.interfaceMap = new Map();
    repository.internalError = null;

    repository.readInterface = getStoreInterface(repository, false);
    repository.writeInterface = getStoreInterface(repository, true);

    repository.initDonePromise = initProjection(repository);

    return {
        getLastAppliedTimestamp: async () => {
            await repository.connectionPromise;
            return repository.lastTimestamp;
        },
        getReadable: async () => {
            await repository.initDonePromise;
            return repository.readInterface;
        },
        getError: async () => {
            await repository.initDonePromise;
            return repository.internalError;
        }
    };
}
