import { MongoClient } from 'mongodb';

export default function init(repository) {
    const META_COLLECTION_NAME = '__resolve_meta_collection';

    if (repository.interfaceMap) {
        throw new Error('The read model storage is already initialized');
    }
    repository.lastTimestamp = 0;

    repository.connectionPromise = MongoClient.connect(
        repository.url,
        repository.options
    ).then(async (database) => {
        const metaCollection = await database.collection(META_COLLECTION_NAME);
        const collectionDescriptors = await metaCollection.find({}).toArray();
        repository.lastTimestamp = collectionDescriptors.reduce(
            (acc, val) => Math.max(acc, val.lastTimestamp),
            0
        );

        repository.collectionMap = new Map();
        const collectionNames = (await database.listCollections().toArray()).map(
            ({ name }) => name
        );

        for (let collectionName of collectionNames) {
            const collection = await database.collection(collectionName);
            repository.collectionMap.set(collectionName, collection);
        }

        return database;
    });

    const getCollection = async (collectionName, isWriteable) => {
        const database = await repository.connectionPromise;

        if (!repository.collectionMap.has(collectionName)) {
            if (!isWriteable) {
                throw new Error(`Collection ${collectionName} does not exist`);
            }

            const collection = await database.collection(collectionName);
            repository.collectionMap.set(collectionName, collection);

            const metaCollection = repository.collectionMap.get(META_COLLECTION_NAME);

            const collectionDescriptor = (await metaCollection.findOne({
                name: collectionName
            })) || {
                name: collectionName,
                lastTimestamp: 0
            };

            await metaCollection.update({ name: collectionName }, collectionDescriptor, {
                upsert: true
            });
        }

        return repository.collectionMap.get(collectionName);
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

                const metaCollection = repository.collectionMap.get(META_COLLECTION_NAME);
                await metaCollection.update(
                    { name: collectionName },
                    { $set: { lastTimestamp: repository.lastTimestamp } }
                );

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
                    Array.from(repository.collectionMap.keys())
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
