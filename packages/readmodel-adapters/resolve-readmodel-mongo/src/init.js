import 'regenerator-runtime/runtime';

import messages from './messages';

const DICTIONARY_TYPE = 'Dictionary';

async function getStorageType(repository, storageName) {
    await repository.connectionPromise;
    const storage = repository.storagesMap.get(storageName);
    if (!storage || !storage.type) {
        return null;
    }
    return storage.type;
}

async function getStorageContent(repository, storageName) {
    await repository.connectionPromise;
    const storage = repository.storagesMap.get(storageName);
    if (!storage || !storage.type) {
        return null;
    }
    return storage.content;
}

async function syncronizeDatabase(repository, database) {
    repository.storagesMap = new Map();
    const metaCollection = await database.collection(repository.metaCollectionName);
    repository.metaCollection = metaCollection;

    const storageDescriptors = await metaCollection.find({}).toArray();
    for (const { storageName, storageType, lastTimestamp } of storageDescriptors) {
        repository.lastTimestamp = Math.max(repository.lastTimestamp, lastTimestamp);
        const mongoCollection = await database.collection(storageName);

        repository.storagesMap.set(storageName, {
            content: mongoCollection,
            type: storageType
        });
    }

    return database;
}

async function createStorage(repository, storageType, isWriteable, storageName) {
    if (!isWriteable) {
        throw new Error(messages.readSideForbiddenOperation(storageType, 'create', storageName));
    }

    const database = await repository.connectionPromise;

    if ((await database.listCollections({ name: storageName }).toArray()).length > 0) {
        throw new Error(messages.collectionExistsNoMeta(storageName));
    }

    const existingStorageType = await getStorageType(repository, storageName);
    if (existingStorageType) {
        throw new Error(messages.storageRecreation(existingStorageType, storageName));
    }

    const mongoCollection = await database.collection(storageName);
    repository.storagesMap.set(storageName, {
        content: mongoCollection,
        type: storageType
    });

    switch (storageType) { // eslint-disable-line default-case
        case DICTIONARY_TYPE: {
            await mongoCollection.createIndex(
                { key: 1 },
                { name: `${DICTIONARY_TYPE}_${storageName}_key`, unique: true }
            );
            break;
        }
    }

    await repository.metaCollection.update(
        { storageName },
        {
            storageName,
            lastTimestamp: 0
        },
        { upsert: true }
    );
}

async function validateAndGetStorage(repository, storageType, storageName) {
    const existingStorageType = await getStorageType(repository, storageName);
    if (!existingStorageType) {
        throw new Error(messages.unexistingStorage(storageType, storageName));
    }

    if (existingStorageType !== storageType) {
        throw new Error(messages.wrongStorageType(storageName, existingStorageType, storageType));
    }

    return await getStorageContent(repository, storageName);
}

async function raiseReadOperationError(storageType, storageName, operation) {
    throw new Error(messages.readSideForbiddenOperation(storageType, operation, storageName));
}

async function getDictionaryInterface(repository, isWriteable, dictionaryName) {
    const dictionaryIfaceKey = `${DICTIONARY_TYPE}_${dictionaryName}_${isWriteable}`;
    const interfaceMap = repository.interfaceMap;

    if (interfaceMap.has(dictionaryIfaceKey)) {
        return interfaceMap.get(dictionaryIfaceKey);
    }

    const raizeAccessError = raiseReadOperationError.bind(null, DICTIONARY_TYPE, dictionaryName);
    await validateAndGetStorage(repository, DICTIONARY_TYPE, dictionaryName);

    const dictionaryIface = {
        exists: async (storage, key) => storage.has(key),
        get: async (storage, key) => (storage.has(key) ? storage.get(key) : null),
        set: raizeAccessError.bind(null, 'set'),
        delete: raizeAccessError.bind(null, 'delete')
    };

    if (isWriteable) {
        dictionaryIface.set = async (storage, key, value) => storage.set(key, value);
        dictionaryIface.delete = async (storage, key) => storage.delete(key);
    }

    for (let operation of Object.keys(dictionaryIface)) {
        const operationHandler = dictionaryIface[operation];
        dictionaryIface[operation] = async (...args) => {
            const storage = await validateAndGetStorage(
                repository,
                DICTIONARY_TYPE,
                dictionaryName
            );
            return await operationHandler(storage, ...args);
        };
    }

    interfaceMap.set(dictionaryIfaceKey, Object.freeze(dictionaryIface));
    return interfaceMap.get(dictionaryIfaceKey);
}

async function listStorages(repository) {
    const resultList = [];
    for (let storageName of repository.storagesMap.keys()) {
        resultList.push({
            name: storageName,
            type: await getStorageType(repository, storageName)
        });
    }

    return resultList;
}

async function existsStorage(repository, storageName) {
    return !!await getStorageType(repository, storageName);
}

async function dropStorage(repository, isWriteable, storageName) {
    if (!isWriteable) {
        throw new Error(messages.readSideForbiddenOperation(null, 'drop', storageName));
    }

    const existingStorageType = await getStorageType(repository, storageName);
    const metaDescriptor = await repository.metaCollection.findOne({ storageName });
    if (!existingStorageType || !metaDescriptor) {
        throw new Error(messages.unexistingStorage(null, storageName));
    }

    const mongoCollection = await getStorageContent(repository, storageName);
    repository.storagesMap.delete(storageName);

    switch (existingStorageType) { // eslint-disable-line default-case
        case DICTIONARY_TYPE: {
            await mongoCollection.drop();
            break;
        }
    }

    await repository.metaCollection;
}

function getStoreInterface(repository, isWriteable) {
    return Object.freeze({
        createDictionary: createStorage.bind(null, repository, DICTIONARY_TYPE, isWriteable),
        dictionary: getDictionaryInterface.bind(null, repository, isWriteable),
        list: listStorages.bind(null, repository),
        exists: existsStorage.bind(null, repository),
        drop: dropStorage.bind(null, repository, isWriteable)
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
        getLastAppliedTimestamp: async () => {
            await repository.connectionPromise;
            return repository.lastTimestamp;
        },

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
