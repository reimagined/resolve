import fs from 'fs';
import funcproxyAdvanced from 'funcproxy';
import NeDB from 'nedb';
import path from 'path';
import hash from './hash';

const funcproxy = (target, func) => funcproxyAdvanced({ target, func });
const NotSupportedError = (description, { method, methodArgs: { property, prop } }) =>
    new Error(
        `${description} does not support queried action '${method}` +
            (property || prop ? `' on '${property || prop}' property` : '\'')
    );

export default function init(repository, onDemandOptions, persistDonePromise, onDestroy) {
    const key = hash(onDemandOptions);
    const databaseFolder = repository.databaseFolder;

    if (repository.get(key)) {
        throw new Error(`The state for '${key}' is already initialized.`);
    }
    if (databaseFolder !== null && !fs.existsSync(databaseFolder)) {
        throw new Error(`Invalid persistence path '${databaseFolder}' specified `);
    }

    const loadCollection = (collectionName, createOnDemand = false) => {
        const collectionMap = repository.get(key).collectionMap;
        if (collectionMap.has(collectionName)) {
            return collectionMap.get(collectionName);
        }

        if (!createOnDemand) {
            throw new Error(`Collection ${collectionName} does not exist`);
        }
        const collection = new NeDB(
            Object.assign(
                { autoload: true },
                databaseFolder !== null
                    ? { filename: path.join(databaseFolder, `./${key}-${collectionName}.db`) }
                    : { inMemoryOnly: true }
            )
        );

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

        const collection = loadCollection(collectionName, isWriteable);

        const writeableBind = (target, funcName, allowOnRead = false) => {
            if (!isWriteable && !allowOnRead) {
                return async () => {
                    throw new Error(`Collection method ${funcName} is not allowed on read side`);
                };
            }

            return (...args) =>
                new Promise((resolve, reject) => {
                    target[funcName](
                        ...args,
                        (err, ...result) => (!err ? resolve(result) : reject(err))
                    );
                });
        };

        const actionsMap = new Map();
        ['insert', 'update', 'remove', 'ensureIndex', 'ensureIndex'].forEach(action =>
            actionsMap.set(action, writeableBind(collection, action, false))
        );
        actionsMap.set('count', writeableBind(collection, 'count', true));

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
            let flowPromise = null;
            const execFind = () =>
                (flowPromise =
                    flowPromise ||
                    new Promise((resolve, reject) =>
                        requestChain
                            .reduce((acc, { type, args }) => acc[type](...args), collection)
                            .exec((err, docs) => (!err ? resolve(docs) : reject(err)))
                    ));

            resultPromise.then = (...continuation) =>
                originalThen(execFind()).then(...continuation);

            resultPromise.catch = (...continuation) =>
                originalThen(execFind()).catch(...continuation);

            return resultPromise;
        };

        actionsMap.set('findOne', wrapFind('findOne'));
        actionsMap.set('find', wrapFind('find'));

        const collectionIface = funcproxy({}, (options) => {
            const { method, methodArgs: { property } } = options;
            if (method !== 'get') {
                throw NotSupportedError(
                    `${isWriteable ? 'Write' : 'Read'} Collection Interface`,
                    options
                );
            }

            return actionsMap.get(property);
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

        const storeIface = funcproxy({}, (options) => {
            const { method, methodArgs: { property } } = options;
            if (method !== 'get') {
                throw NotSupportedError(
                    `${isWriteable ? 'Write' : 'Read'} Store Interface`,
                    options
                );
            }

            switch (property) {
                case 'getCollectionNames':
                    return () => Array.from(repository.get(key).collectionMap.keys());
                case 'getCollection':
                    return name => getCollectionInterface(name, isWriteable);
                default:
                    return getCollectionInterface(property, isWriteable);
            }
        });

        interfaceMap.set(storeKey, storeIface);
        return storeIface;
    };

    repository.set(key, {
        interfaceMap: new Map(),
        readInterface: getStoreInterface(false),
        writeInterface: getStoreInterface(true),
        initializeKey: new Promise(resolve =>
            Promise.resolve()
                .then(() =>
                    repository.initHandler.bind(getStoreInterface(true), {
                        type: '@@INIT'
                    })
                )
                .then(resolve)
        ),
        collectionMap: new Map(),
        internalError: null,
        readApi: {
            getReadable: async () => {
                await persistDonePromise;
                return repository.get(key).readInterface;
            },
            getError: async () => repository.get(key).internalError
        },
        onDestroy
    });
}
