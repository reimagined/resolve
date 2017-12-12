import 'regenerator-runtime/runtime';

async function getCollection(repository, collectionName) {
    await repository.connectionPromise;
    return repository.collectionMap.get(collectionName);
}

async function getMetaCollection(repository) {
    return await getCollection(repository, repository.metaCollectionName);
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
        throw new Error(
            `Collection ${collectionName} had already been created in current database, ` +
                'but not with resolve read model adapter and has no required meta information'
        );
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
        return 'Search expression should be object with fields and search values';
    }
    Object.keys(searchExpression).forEach((key) => {
        if (checkOptionShape(searchExpression[key].constructor, [Number, String])) {
            return 'Search expression values should be either number or string';
        }
        if (key.indexOf('$') > -1) {
            return 'Search expression should not contain query operation';
        }
    });

    return null;
}

function sanitizeUpdateExpression(updateExpression) {
    if (!checkOptionShape(updateExpression, [Object])) {
        return 'Update expression should be object with fields and replace values';
    }

    const allowedOperators = ['$set', '$unset', '$inc', '$push', '$pull'];
    Object.keys(updateExpression).forEach((key) => {
        if (key.indexOf('$') > -1 || !allowedOperators.includes(key)) {
            return `Update operator ${key} is not permitted`;
        }
    });

    return null;
}

async function wrapWriteFunction(funcName, repository, collectionName, ...args) {
    const collection = await getCollection(repository, collectionName, true);
    const metaCollection = await getMetaCollection(repository);

    if ((funcName !== 'update' && args.length > 1) || (funcName === 'update' && args.length > 2)) {
        throw new Error(`Additional options in modify operation ${funcName} are prohibited`);
    }

    await metaCollection.update(
        { collectionName },
        { $set: { lastTimestamp: repository.lastTimestamp } }
    );

    if (funcName === 'ensureIndex') {
        if (
            !checkOptionShape(args[0], [Object], 1) ||
            Math.abs(parseInt(Object.values(args[0])[0], 10)) !== 1
        ) {
            throw new Error(
                'Ensure index operation accepts only object with one key and 1/-1 value'
            );
        }

        await collection.createIndex(args[0]);
        await metaCollection.update(
            { collectionName },
            { $push: { indexes: Object.keys(args[0])[0] } }
        );
        return;
    }

    if (funcName === 'deleteIndex') {
        if (!checkOptionShape(args[0], [String])) {
            throw new Error('Delete index operation accepts only string value');
        }

        await collection.dropIndex(args[0]);
        await metaCollection.update({ collectionName }, { $pull: { indexes: args[0] } });
        return;
    }

    if (funcName === 'delete' || funcName === 'update') {
        const sanitizeErrors = [
            sanitizeSearchExpression(args[0]),
            funcName === 'update' ? sanitizeUpdateExpression(args[1]) : null
        ].filter(error => error !== null);

        if (sanitizeErrors.length > 0) {
            throw new Error(`Operation ${funcName} contains forbidden patterns:
                ${sanitizeErrors.join(', ')}
            `);
        }
    }

    return await collection[funcName](...args);
}

async function execFind(options) {
    const metaCollection = await options.metaCollectionPromise;
    const collection = await options.collectionPromise;

    if (options.requestFold) {
        throw new Error(
            'After documents are retrieved with a search request, ' +
                'this search request cannot be reused'
        );
    }

    const searchFields = Object.keys(options.requestChain[0].args);
    const indexesFields =
        (await metaCollection.findOne({ collectionName: options.collectionName })).indexes || [];

    if (!searchFields.reduce((acc, val) => acc && indexesFields.includes(val), true)) {
        throw new Error('Search on non-indexed fields is forbidden');
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
    const metaCollectionPromise = getMetaCollection(repository);
    const collectionPromise = getCollection(repository, collectionName);
    const resultPromise = Promise.resolve();
    const requestChain = [{ type: initialFind, args: searchExpression }];

    const sanitizeError = sanitizeSearchExpression(searchExpression);
    if (sanitizeError) {
        return Promise.reject(sanitizeError);
    }

    ['skip', 'limit'].forEach((cmd) => {
        resultPromise[cmd] = (count) => {
            requestChain.push({ type: cmd, args: count });
            return resultPromise;
        };
    });

    const originalThen = resultPromise.then.bind(resultPromise);
    const boundExecFind = execFind.bind(null, {
        requestChain,
        collectionPromise,
        metaCollectionPromise,
        collectionName
    });

    resultPromise.then = (...continuation) => originalThen(boundExecFind).then(...continuation);

    resultPromise.catch = (...continuation) => originalThen(boundExecFind).catch(...continuation);

    return resultPromise;
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

    const countDocuments = async (searchExpression) => {
        const collection = await getCollection(collectionName, isWriteable);
        return await collection.count(searchExpression);
    };

    const exceptWriteFunction = async (funcName) => {
        throw new Error(
            `The ${collectionName} collection’s ${funcName} method is not allowed on the read side`
        );
    };

    const collectionIface = {
        findOne: wrapFind.bind(null, 'findOne', repository, collectionName),
        find: wrapFind.bind(null, 'find', repository, collectionName),
        count: countDocuments
    };

    Object.assign(
        collectionIface,
        ['insert', 'update', 'remove', 'ensureIndex', 'removeIndex'].reduce((acc, funcName) => {
            acc[funcName] = (isWriteable ? wrapWriteFunction : exceptWriteFunction).bind(
                null,
                funcName,
                repository,
                collectionName
            );
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
        throw new Error('The read model storage is already initialized');
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
        getLastAppliedTimestamp: async () =>
            await repository.connectionPromise.then(() => repository.lastTimestamp),
        getReadable: async () => repository.readInterface,
        getError: async () => repository.internalError
    };
}
