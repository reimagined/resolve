import NeDB from 'nedb';
import hash from './hash';

export default function init(repository, onDemandOptions, persistDonePromise) {
    const key = hash(onDemandOptions);
    if (repository.get(key)) {
        throw new Error(`The state for '${key}' is already initialized.`);
    }

    const loadCollection = (collectionName, createOnWrite = false) => {
        const collectionMap = repository.get(key).collectionMap;
        if (collectionMap.has(collectionName)) {
            return collectionMap.get(collectionName);
        }
        if (!createOnWrite) {
            throw new Error(`Collection ${collectionName} does not exist`);
        }

        const collection = new NeDB({ autoload: true, inMemoryOnly: true });
        collectionMap.set(collectionName, collection);
        return collection;
    };

    // Provide interface https://docs.mongodb.com/manual/reference/method/js-collection/
    const getCollectionInterface = (collectionName, isWriteable) => {
        const collectionKey = hash(`COLLECTION_${collectionName}_${isWriteable}`);
        const interfaceMap = repository.get(key).interfaceMap;

        if (interfaceMap.has(collectionKey)) {
            return interfaceMap.get(collectionKey);
        }

        const bindCollectionMethod = (funcName, allowOnRead = false) => {
            const collection = loadCollection(collectionName, isWriteable);
            if (!isWriteable && !allowOnRead) {
                return async () => {
                    throw new Error(`Collection method ${funcName} is not allowed on read side`);
                };
            }

            return (...args) =>
                new Promise((resolve, reject) => {
                    collection[funcName](
                        ...args,
                        (err, ...result) => (!err ? resolve(result) : reject(err))
                    );
                });
        };

        const execFind = (options) => {
            const collection = loadCollection(collectionName, isWriteable);
            if (options.requestFold) {
                throw new Error('Find request cannot be reused after documents retrieving');
            }

            options.requestFold = options.requestChain.reduce(
                (acc, { type, args }) => acc[type](...args),
                collection
            );

            return new Promise((resolve, reject) =>
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
            ensureIndex: bindCollectionMethod('ensureIndex', false),
            removeIndex: bindCollectionMethod('removeIndex', false),
            count: bindCollectionMethod('count', true),
            findOne: wrapFind('findOne'),
            find: wrapFind('find')
        });

        interfaceMap.set(collectionKey, collectionIface);
        return collectionIface;
    };

    const initProjection = (storeIface) => {
        if (!repository.get(key).initialEventPromise) {
            repository.get(key).initialEventPromise = Promise.resolve().then(() =>
                repository.initHandler(storeIface)
            );
        }
        return repository.get(key).initialEventPromise;
    };

    // Provide interface https://docs.mongodb.com/manual/reference/method/js-database/
    const getStoreInterface = async (isWriteable, isLazy) => {
        const storeKey = !isWriteable
            ? isLazy ? 'STORE_READ_SIDE' : 'STORE_LAZY_READ_SIDE'
            : 'STORE_WRITE_SIDE';
        const interfaceMap = repository.get(key).interfaceMap;

        if (interfaceMap.has(storeKey)) {
            return interfaceMap.get(storeKey);
        }

        let storeIface = null;

        if (isWriteable || (!isWriteable && !isLazy)) {
            storeIface = Object.freeze({
                listCollections: async () => Array.from(repository.get(key).collectionMap.keys()),
                collection: async name => getCollectionInterface(name, isWriteable)
            });

            if (!isWriteable) {
                const writeStoreInterface = await getStoreInterface(true);
                await initProjection(writeStoreInterface);
                repository.get(key).runEventProcessing();
                await persistDonePromise;
            }
        } else if (!isWriteable && isLazy) {
            const writeStoreInterface = await getStoreInterface(true);
            const readStoreInterface = await getStoreInterface(false);

            storeIface = Object.freeze(
                Object.keys(readStoreInterface).reduce((result, name) => {
                    result[name] = async (...args) => {
                        await initProjection(writeStoreInterface);
                        repository.get(key).runEventProcessing();
                        await persistDonePromise;
                        return await readStoreInterface[name](...args);
                    };
                    return result;
                }, {})
            );
        }

        interfaceMap.set(storeKey, storeIface);
        return storeIface;
    };

    repository.set(key, {
        interfaceMap: new Map(),
        initialEventPromise: null,
        getStoreInterface,
        collectionMap: new Map(),
        internalError: null
    });

    repository.get(key).eventProcessingPromise = new Promise(
        resolve => (repository.get(key).runEventProcessing = resolve)
    );

    return {
        getReadable: async preferLazy => await getStoreInterface(false, preferLazy),
        getError: async () => repository.get(key).internalError
    };
}
