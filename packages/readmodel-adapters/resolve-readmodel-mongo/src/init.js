export async function syncronizeDatabase(repository, database) {
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

export async function createCollection(repository, database, collectionName) {
    if ((await database.listCollections({ name: collectionName }).toArray()).length > 0) {
        throw new Error(
            `Collection ${collectionName} had already been created in current database, ` +
                'but not with resolve read model adapter and has no required meta information'
        );
    }

    const collection = await database.collection(collectionName);
    repository.collectionMap.set(collectionName, collection);

    const metaCollection = repository.collectionMap.get(repository.metaCollectionName);
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

export async function getCollection(repository, collectionName, isWriteable) {
    const database = await repository.connectionPromise;

    if (!repository.collectionMap.has(collectionName)) {
        if (!isWriteable) {
            throw new Error(`Collection ${collectionName} does not exist`);
        }
        await createCollection(repository, database, collectionName);
    }

    return repository.collectionMap.get(collectionName);
}

export function checkOptionShape(option, types, count) {
    return !(
        option === null ||
        option === undefined ||
        !types.reduce((acc, type) => acc || option.constructor === type, false) ||
        (option.constructor === Object &&
            (Number.isInteger(count) && Object.keys(option).length !== count))
    );
}

export function sanitizeSearchExpression(searchExpression) {
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

export function sanitizeUpdateExpression(updateExpression) {}

export async function wrapWriteFunction(funcName, repository, collectionName, ...args) {
    const collection = await getCollection(repository, collectionName, true);
    const metaCollection = await getCollection(repository, repository.metaCollectionName, true);

    if ((funcName !== 'update' && args.length > 0) || (funcName === 'update' && args.length > 1)) {
        throw new Error(`Additional options in modify operation ${funcName} are prohibited`);
    }

    await metaCollection.update(
        { collectionName },
        { $set: { lastTimestamp: repository.lastTimestamp } }
    );

    if (funcName === 'ensureIndex') {
        if (!checkOptionShape(args[0], [Object], 1) || Math.abs(parseInt(args[0], 10)) !== 1) {
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

export async function execFind(options) {
    const collection = await options.collectionPromise;

    if (options.requestFold) {
        throw new Error(
            'After documents are retrieved with a search request, ' +
                'this search request cannot be reused'
        );
    }

    options.requestFold = options.requestChain.reduce(
        (acc, { type, args }) => acc[type](...args),
        collection
    );

    if (typeof options.requestFold.toArray === 'function') {
        return await options.requestFold.toArray();
    }

    return await options.requestFold;
}

export function wrapFind(initialFind, repository, collectionName, searchExpression) {
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
    const boundExecFind = execFind.bind(null, { requestChain, collectionPromise });

    resultPromise.then = (...continuation) => originalThen(boundExecFind).then(...continuation);

    resultPromise.catch = (...continuation) => originalThen(boundExecFind).catch(...continuation);

    return resultPromise;
}

// Provide interface https://docs.mongodb.com/manual/reference/method/js-collection/
export async function getCollectionInterface(repository, collectionName, isWriteable) {
    const collectionKey = `COLLECTION_${collectionName}_${isWriteable}`;
    const interfaceMap = repository.interfaceMap;

    if (interfaceMap.has(collectionKey)) {
        return interfaceMap.get(collectionKey);
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

// Provide interface https://docs.mongodb.com/manual/reference/method/js-database/
export async function getStoreInterface(repository, isWriteable) {
    const storeKey = !isWriteable ? 'STORE_READ_SIDE' : 'STORE_WRITE_SIDE';
    const interfaceMap = repository.interfaceMap;

    if (interfaceMap.has(storeKey)) {
        return interfaceMap.get(storeKey);
    }

    let storeIface = Object.freeze({
        listCollections: async () =>
            repository.connectionPromise.then(() =>
                Array.from(repository.collectionMap.keys()).filter(
                    name => name !== repository.metaCollectionName
                )
            ),
        collection: async (name) => {
            await getCollection(repository, name, isWriteable);
            return getCollectionInterface(repository, name, isWriteable);
        }
    });

    interfaceMap.set(storeKey, storeIface);
    return storeIface;
}

export async function initProjection(repository) {
    await repository.connectionPromise;
    if (repository.lastTimestamp !== 0) return;
    repository.lastTimestamp = 1;

    try {
        await repository.initHandler(repository.writeInterface);
    } catch (error) {
        repository.internalError = error;
    }
}

export default function init(repository, MongoClient) {
    if (repository.interfaceMap) {
        throw new Error('The read model storage is already initialized');
    }
    repository.lastTimestamp = 0;

    repository.connectionPromise = MongoClient.connect(repository.url, repository.options).then(
        syncronizeDatabase.bind(null, repository)
    );

    repository.interfaceMap = new Map();
    repository.initialEventPromise = null;
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
