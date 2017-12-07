import { MongoClient } from 'mongodb';

export default function init(repository) {
    if (repository.interfaceMap) {
        throw new Error('The read model storage is already initialized');
    }
    repository.lastTimestamp = 0;

    const syncronizeDatabase = async (database) => {
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
    };

    repository.connectionPromise = MongoClient.connect(repository.url, repository.options).then(
        syncronizeDatabase
    );

    const createCollection = async (collectionName) => {
        const database = await repository.connectionPromise;

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
                lastTimestamp: 0
            },
            { upsert: true }
        );
    };

    const getCollection = async (collectionName, isWriteable) => {
        if (!repository.collectionMap.has(collectionName)) {
            if (!isWriteable) {
                throw new Error(`Collection ${collectionName} does not exist`);
            }
            await createCollection(collectionName);
        }

        return repository.collectionMap.get(collectionName);
    };

    const setCollectionTimestamp = async (collectionName, timestamp) => {
        const metaCollection = repository.collectionMap.get(repository.metaCollectionName);
        await metaCollection.update({ collectionName }, { $set: { lastTimestamp: timestamp } });
    };

    // Provide interface https://docs.mongodb.com/manual/reference/method/js-collection/
    const getCollectionInterface = async (collectionName, isWriteable) => {
        const collectionKey = `COLLECTION_${collectionName}_${isWriteable}`;
        const interfaceMap = repository.interfaceMap;

        if (interfaceMap.has(collectionKey)) {
            return interfaceMap.get(collectionKey);
        }

        const bindCollectionMethod = (funcName, allowOnRead = false) => {
            if (!isWriteable && !allowOnRead) {
                return async () => {
                    throw new Error(
                        `The collection’s ${funcName} method is not allowed on the read side`
                    );
                };
            }

            return async (...args) => {
                const collection = await getCollection(collectionName, isWriteable);
                await setCollectionTimestamp(collectionName, repository.lastTimestamp);
                return await collection[funcName](...args);
            };
        };

        const execFind = async (options) => {
            const collection = await getCollection(collectionName, isWriteable);

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
        };

        const wrapFind = initialFind => (...findArgs) => {
            const resultPromise = Promise.resolve();
            const requestChain = [{ type: initialFind, args: findArgs }];

            ['sort', 'skip', 'limit', 'projection'].forEach(
                cmd =>
                    (resultPromise[cmd] = (...args) => {
                        requestChain.push({ type: cmd, args });
                        return resultPromise;
                    })
            );

            const originalThen = resultPromise.then.bind(resultPromise);
            const boundExecFind = execFind.bind(null, { requestChain });

            resultPromise.then = (...continuation) =>
                originalThen(boundExecFind).then(...continuation);

            resultPromise.catch = (...continuation) =>
                originalThen(boundExecFind).catch(...continuation);

            return resultPromise;
        };

        const collectionIface = Object.freeze({
            insert: bindCollectionMethod('insert', false),
            update: bindCollectionMethod('update', false),
            remove: bindCollectionMethod('remove', false),
            ensureIndex: bindCollectionMethod('createIndex', false),
            removeIndex: bindCollectionMethod('dropIndex', false),
            count: bindCollectionMethod('count', true),
            findOne: wrapFind('findOne'),
            find: wrapFind('find')
        });

        interfaceMap.set(collectionKey, collectionIface);
        return collectionIface;
    };

    // Provide interface https://docs.mongodb.com/manual/reference/method/js-database/
    const getStoreInterface = (isWriteable) => {
        const storeKey = !isWriteable ? 'STORE_READ_SIDE' : 'STORE_WRITE_SIDE';
        const interfaceMap = repository.interfaceMap;

        if (interfaceMap.has(storeKey)) {
            return interfaceMap.get(storeKey);
        }

        let storeIface = Object.freeze({
            listCollections: async () =>
                repository.connectionPromise.then(() =>
                    Array.from(repository.collectionMap.keys()).filter(
                        name => name !== META_COLLECTION_NAME
                    )
                ),
            collection: async name => getCollectionInterface(name, isWriteable)
        });

        interfaceMap.set(storeKey, storeIface);
        return storeIface;
    };

    Object.assign(repository, {
        interfaceMap: new Map(),
        initialEventPromise: null,
        internalError: null
    });

    Object.assign(repository, {
        readInterface: getStoreInterface(false),
        writeInterface: getStoreInterface(true)
    });

    repository.initDonePromise = (async () => {
        if (repository.lastTimestamp !== 0) return;
        repository.lastTimestamp = 1;

        try {
            await repository.initHandler(repository.writeInterface);
        } catch (error) {
            repository.internalError = error;
        }
    })();

    return {
        getLastAppliedTimestamp: async () =>
            await repository.connectionPromise.then(() => repository.lastTimestamp),
        getReadable: async () => repository.readInterface,
        getError: async () => repository.internalError
    };
}
