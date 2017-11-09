import NeDB from 'nedb';
import hash from './hash';

export default function init(repository, onDemandOptions) {
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

    // Provide interface https://docs.mongodb.com/manual/reference/method/js-database/
    const getStoreInterface = (isWriteable) => {
        const storeKey = isWriteable ? 'STORE_WRITE_SIDE' : 'STORE_READ_SIDE';
        const interfaceMap = repository.get(key).interfaceMap;

        if (interfaceMap.has(storeKey)) {
            return interfaceMap.get(storeKey);
        }

        const storeIface = Object.freeze({
            listCollections: () => Array.from(repository.get(key).collectionMap.keys()),
            collection: name => getCollectionInterface(name, isWriteable)
        });

        interfaceMap.set(storeKey, storeIface);
        return storeIface;
    };

    const initializeKey = Promise.resolve().then(() =>
        repository.initHandler(getStoreInterface(true))
    );

    repository.set(key, {
        interfaceMap: new Map(),
        readInterface: initializeKey.then(() => getStoreInterface(false)),
        writeInterface: initializeKey.then(() => getStoreInterface(true)),
        collectionMap: new Map(),
        internalError: null
    });

    return {
        getReadable: async () => repository.get(key).readInterface,
        getError: async () => repository.get(key).internalError
    };
}
