import { MongoClient } from 'mongodb';

export default function init(repository) {
    if (repository.interfaceMap) {
        throw new Error('The read model storage is already initialized');
    }

    repository.connectionPromise = MongoClient.connect(
        repository.url,
        repository.options
    ).then(async (database) => {
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

        if (!repository.collectionList.has(collectionName)) {
            if (!isWriteable) {
                throw new Error(`Collection ${collectionName} does not exist`);
            }

            const collection = await database.collection(collectionName);
            repository.collectionMap.set(collectionName, collection);
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

                return await new Promise((resolve, reject) => {
                    collection[funcName](
                        ...args,
                        (err, ...result) => (!err ? resolve(result) : reject(err))
                    );
                });
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

            return await new Promise((resolve, reject) =>
                options.requestFold.exec((err, docs) => (!err ? resolve(docs) : reject(err)))
            );
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
                repository.connectionPromise.then(Array.from.bind(null, repository.collectionList)),
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

    repository.initDonePromise = Promise.resolve()
        .then(repository.initHandler.bind(null, repository.writeInterface))
        .catch(error => repository.internalError);

    return {
        getReadable: async () => repository.readInterface,
        getError: async () => repository.internalError
    };
}
