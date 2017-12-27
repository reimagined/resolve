import 'regenerator-runtime/runtime';

import messages from './messages';

function createCollection(repository, collectionName) {
    const collection = repository.createDatabaseCollection();
    repository.collectionMap.set(collectionName, collection);
    repository.collectionIndexesMap.set(collectionName, new Set());
}

async function performCollectionOperation(resource, operationName, ...inputArgs) {
    return await new Promise((resolve, reject) =>
        resource[operationName](...inputArgs, (err, ...outputArgs) => {
            if (!err) {
                resolve(...outputArgs);
            } else {
                reject(err);
            }
        })
    );
}

function checkOptionShape(option, types) {
    return !(
        option === null ||
        option === undefined ||
        !types.reduce((acc, type) => acc || option.constructor === type, false)
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

function sanitizeReadIndexExpression(indexExpression) {
    if (
        !checkOptionShape(indexExpression, [Object]) ||
        Object.keys(indexExpression).length !== 1 ||
        Math.abs(parseInt(Object.values(indexExpression)[0], 10)) !== 1
    ) {
        return messages.indexDescriptorReadShape;
    }

    return null;
}

async function applyEnsureIndex(collection, collectionIndexes, indexDescriptor) {
    if (!checkOptionShape(indexDescriptor, [Object])) {
        throw new Error(messages.indexDescriptorWriteShape);
    }

    const { fieldName, fieldType, order = 1, ...rest } = indexDescriptor;
    if (
        Object.keys(rest).length > 0 ||
        fieldName.constructor !== String ||
        (fieldType !== 'number' && fieldType !== 'string') ||
        Math.abs(order) !== 1
    ) {
        throw new Error(messages.indexDescriptorWriteShape);
    }

    if (collectionIndexes.has(fieldName)) return;

    await performCollectionOperation(collection, 'ensureIndex', { fieldName });
    collectionIndexes.add(fieldName);
}

async function applyRemoveIndex(collection, collectionIndexes, indexName) {
    if (!checkOptionShape(indexName, [String])) {
        throw new Error(messages.deleteIndexArgumentShape);
    }
    if (!collectionIndexes.has(indexName)) return;

    await performCollectionOperation(collection, 'removeIndex', indexName);
    collectionIndexes.delete(indexName);
}

function sanitizeUpdateOrDelete(operation, collectionIndexes, searchExpression, updateExpression) {
    const sanitizeErrors = [
        sanitizeSearchExpression(searchExpression),
        operation === 'update' ? sanitizeUpdateExpression(updateExpression) : null
    ].filter(error => error !== null);

    if (sanitizeErrors.length > 0) {
        throw new Error(messages.modifyOperationForbiddenPattern(operation, sanitizeErrors));
    }

    for (let key of Object.keys(searchExpression)) {
        if (!collectionIndexes.has(key)) {
            throw new Error(messages.mofidyOperationOnlyIndexedFiels(operation, key));
        }
    }
}

async function wrapWriteFunction(operation, collectionName, repository, ...args) {
    const collection = repository.collectionMap.get(collectionName);
    const collectionIndexes = repository.collectionIndexesMap.get(collectionName);

    if (
        (operation !== 'update' && args.length > 1) ||
        (operation === 'update' && args.length > 2)
    ) {
        throw new Error(messages.mofidyOperationNoOptions(operation));
    }

    switch (operation) { // eslint-disable-line default-case
        case 'ensureIndex':
            await applyEnsureIndex(collection, collectionIndexes, args[0]);
            break;

        case 'removeIndex':
            await applyRemoveIndex(collection, collectionIndexes, args[0]);
            break;

        case 'insert':
            await performCollectionOperation(collection, 'insert', {
                _id: repository.counter++,
                ...args[0]
            });
            break;

        case 'update':
        case 'remove':
            sanitizeUpdateOrDelete(operation, collectionIndexes, args[0], args[1]);
            await performCollectionOperation(collection, operation, ...args);
            break;
    }
}

async function execFind(options) {
    if (options.requestFold) {
        throw new Error(messages.findOperationNoReuse);
    }

    const foundErrors = options.foundErrors.filter(value => value !== null);
    if (foundErrors.length > 0) {
        throw new Error(foundErrors.join(', '));
    }

    const searchFields = Object.keys(options.requestChain[0].args);
    if (!searchFields.reduce((acc, val) => acc && options.collectionIndexes.has(val), true)) {
        throw new Error(messages.searchOnlyIndexedFields);
    }

    if (options.requestChain[1] && options.requestChain[1].type === 'sort') {
        const indexExpression = Object.keys(options.requestChain[1].args);
        if (
            !indexExpression.reduce((acc, val) => acc && options.collectionIndexes.has(val), true)
        ) {
            throw new Error(messages.sortOnlyIndexedFields);
        }
    }

    options.requestFold = options.requestChain.reduce(
        (acc, { type, args }) => acc[type](args),
        options.collection
    );

    return await performCollectionOperation(options.requestFold, 'exec');
}

function wrapFind(initialFind, repository, collectionName, searchExpression) {
    const collection = repository.collectionMap.get(collectionName);
    const collectionIndexes = repository.collectionIndexesMap.get(collectionName);

    const resultPromise = Promise.resolve();
    const requestChain = [{ type: initialFind, args: searchExpression }];
    const foundErrors = [sanitizeSearchExpression(searchExpression)];

    ['sort', 'skip', 'limit'].forEach((cmd) => {
        resultPromise[cmd] = (value) => {
            if (cmd === 'sort') {
                foundErrors.push(sanitizeReadIndexExpression(value));
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
        collection,
        collectionIndexes,
        foundErrors
    });

    resultPromise.then = (...continuation) => originalThen(boundExecFind).then(...continuation);

    resultPromise.catch = (...continuation) => originalThen(boundExecFind).catch(...continuation);

    return resultPromise;
}

async function countDocuments(repository, collectionName, searchExpression) {
    const collection = repository.collectionMap.get(collectionName);
    const collectionIndexes = repository.collectionIndexesMap.get(collectionName);

    const sanitizeError = sanitizeSearchExpression(searchExpression);
    if (sanitizeError) {
        throw new Error(sanitizeError);
    }

    const searchFields = Object.keys(searchExpression);
    if (!searchFields.reduce((acc, val) => acc && collectionIndexes.has(val), true)) {
        throw new Error(messages.searchOnlyIndexedFields);
    }

    return await performCollectionOperation(collection, 'count', searchExpression);
}

// Provide interface https://docs.mongodb.com/manual/reference/method/js-collection/
async function getCollectionInterface(repository, isWriteable, collectionName) {
    const collectionKey = `COLLECTION_${collectionName}_${isWriteable}`;
    const interfaceMap = repository.interfaceMap;

    if (interfaceMap.has(collectionKey)) {
        return interfaceMap.get(collectionKey);
    }

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
    return Array.from(repository.collectionMap.keys());
}

// Provide interface https://docs.mongodb.com/manual/reference/method/js-database/
function getStoreInterface(repository, isWriteable) {
    return Object.freeze({
        collection: getCollectionInterface.bind(null, repository, isWriteable),
        listCollections: listCollections.bind(null, repository)
    });
}

async function initProjection(repository) {
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
    if (typeof repository.initHandler !== 'function') {
        repository.initHandler = async () => {};
    }

    repository.interfaceMap = new Map();
    repository.collectionMap = new Map();
    repository.collectionIndexesMap = new Map();
    repository.internalError = null;
    repository.counter = +Date.now();

    repository.readInterface = getStoreInterface(repository, false);
    repository.writeInterface = getStoreInterface(repository, true);

    repository.initDonePromise = initProjection(repository);

    return {
        getLastAppliedTimestamp: async () => 0,
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
