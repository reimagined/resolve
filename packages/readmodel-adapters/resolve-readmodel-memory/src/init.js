import 'regenerator-runtime/runtime';

function createCollection(repository, collectionName) {
    const collection = repository.createDatabaseCollection();
    repository.collectionMap.set(collectionName, collection);
    repository.collectionIndexesMap.set(collectionName, new Set());
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
        return 'Search expression should be object with fields and search values';
    }
    for (let key of Object.keys(searchExpression)) {
        if (!checkOptionShape(searchExpression[key], [Number, String])) {
            return (
                'Search expression values should be either number or string ' +
                'and should not contain query operator'
            );
        }
    }

    return null;
}

function sanitizeUpdateExpression(updateExpression) {
    if (!checkOptionShape(updateExpression, [Object])) {
        return 'Update expression should be object with fields and replace values';
    }

    const allowedOperators = ['$set', '$unset', '$inc', '$push', '$pull'];
    for (let key of Object.keys(updateExpression)) {
        if (key.indexOf('$') > -1 && !allowedOperators.includes(key)) {
            return `Update operator ${key} is not permitted`;
        }
    }

    return null;
}

function sanitizeIndexExpression(indexExpression) {
    if (
        !checkOptionShape(indexExpression, [Object], 1) ||
        Math.abs(parseInt(Object.values(indexExpression)[0], 10)) !== 1
    ) {
        return 'Index descriptor should bee object with only one name key and 1/-1 sort value';
    }

    return null;
}

async function applyEnsureIndex(collection, collectionIndexes, indexDescriptor) {
    const sanitizeError = sanitizeIndexExpression(indexDescriptor);
    if (sanitizeError) {
        throw new Error(sanitizeError);
    }

    const indexName = Object.keys(indexDescriptor)[0];
    if (collectionIndexes.has(indexName)) return;

    await new Promise((resolve, reject) =>
        collection.ensureIndex({ fieldName: indexName }, err => (!err ? resolve() : reject(err)))
    );

    collectionIndexes.add(indexName);
}

async function applyRemoveIndex(collection, collectionIndexes, indexName) {
    if (!checkOptionShape(indexName, [String])) {
        throw new Error('Delete index operation accepts only string value');
    }

    if (!collectionIndexes.has(indexName)) return;

    await new Promise((resolve, reject) =>
        collection.removeIndex(indexName, err => (!err ? resolve() : reject(err)))
    );

    collectionIndexes.delete(indexName);
}

function sanitizeUpdateOrDelete(funcName, collectionIndexes, searchExpression, updateExpression) {
    const sanitizeErrors = [
        sanitizeSearchExpression(searchExpression),
        funcName === 'update' ? sanitizeUpdateExpression(updateExpression) : null
    ].filter(error => error !== null);

    if (sanitizeErrors.length > 0) {
        throw new Error(`Operation ${funcName} contains forbidden patterns:
                ${sanitizeErrors.join(', ')}
            `);
    }

    for (let key of Object.keys(searchExpression)) {
        if (!collectionIndexes.has(key)) {
            throw new Error(
                `Operation ${funcName} cannot be performed on non-indexed ` +
                    `field ${key} in search pattern`
            );
        }
    }
}

async function wrapWriteFunction(funcName, collectionName, repository, ...args) {
    const collection = repository.collectionMap.get(collectionName);
    const collectionIndexes = repository.collectionIndexesMap.get(collectionName);

    if ((funcName !== 'update' && args.length > 1) || (funcName === 'update' && args.length > 2)) {
        throw new Error(`Additional options in modify operation ${funcName} are prohibited`);
    }

    switch (funcName) { // eslint-disable-line default-case
        case 'ensureIndex':
            await applyEnsureIndex(collection, collectionIndexes, args[0]);
            break;

        case 'removeIndex':
            await applyRemoveIndex(collection, collectionIndexes, args[0]);
            break;

        case 'insert':
            await new Promise((resolve, reject) =>
                collection.insert(
                    { _id: repository.counter++, ...args[0] },
                    err => (!err ? resolve() : reject(err))
                )
            );
            break;

        case 'update':
        case 'remove':
            sanitizeUpdateOrDelete(funcName, collectionIndexes, args[0], args[1]);
            await new Promise((resolve, reject) =>
                collection[funcName](...args, err => (!err ? resolve() : reject(err)))
            );
            break;
    }
}

async function execFind(options) {
    if (options.requestFold) {
        throw new Error(
            'After documents are retrieved with a search request, ' +
                'this search request cannot be reused'
        );
    }

    const foundErrors = options.foundErrors.filter(value => value !== null);
    if (foundErrors.length > 0) {
        throw new Error(foundErrors.join(', '));
    }

    const searchFields = Object.keys(options.requestChain[0].args);
    if (!searchFields.reduce((acc, val) => acc && options.collectionIndexes.has(val), true)) {
        throw new Error('Search on non-indexed fields is forbidden');
    }

    if (options.requestChain[1] && options.requestChain[1].type === 'sort') {
        const indexExpression = Object.keys(options.requestChain[1].args);
        if (
            !indexExpression.reduce((acc, val) => acc && options.collectionIndexes.has(val), true)
        ) {
            throw new Error('Sort by non-indexed fields is forbidden');
        }
    }

    options.requestFold = options.requestChain.reduce(
        (acc, { type, args }) => acc[type](args),
        options.collection
    );

    return await new Promise((resolve, reject) =>
        options.requestFold.exec((err, docs) => (!err ? resolve(docs) : reject(err)))
    );
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
                foundErrors.push(sanitizeIndexExpression(value));
                if (requestChain.length > 1 || initialFind !== 'find') {
                    foundErrors.push('Sorting can be specified only after find immediately');
                }
            }

            if (requestChain.find(entry => entry.type === cmd)) {
                foundErrors.push(`Search operation ${cmd} is already in find chain`);
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
        throw new Error('Search on non-indexed fields is forbidden');
    }

    return await new Promise((resolve, reject) =>
        collection.count(searchExpression, (err, count) => (!err ? resolve(count) : reject(err)))
    );
}

async function exceptWriteFunction(funcName, collectionName) {
    throw new Error(
        `The ${collectionName} collection’s ${funcName} method is not allowed on the read side`
    );
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
            throw new Error(`Collection ${collectionName} does not exist`);
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
        ['insert', 'update', 'remove', 'ensureIndex', 'removeIndex'].reduce((acc, funcName) => {
            acc[funcName] = (isWriteable ? wrapWriteFunction : exceptWriteFunction).bind(
                null,
                funcName,
                collectionName,
                repository
            );
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
    const storeKey = !isWriteable ? 'STORE_READ_SIDE' : 'STORE_WRITE_SIDE';
    const interfaceMap = repository.interfaceMap;

    if (interfaceMap.has(storeKey)) {
        return interfaceMap.get(storeKey);
    }

    let storeIface = Object.freeze({
        collection: getCollectionInterface.bind(null, repository, isWriteable),
        listCollections: listCollections.bind(null, repository)
    });

    interfaceMap.set(storeKey, storeIface);
    return storeIface;
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
        throw new Error('The read model storage is already initialized');
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
