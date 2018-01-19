import 'regenerator-runtime/runtime';

import messages from './messages';

const DICTIONARY_TYPE = 'Dictionary';

async function getStorageType(repository, storageName) {
    const storage = repository.storagesMap.get(storageName);
    if (!storage || !storage.type) {
        return null;
    }
    return storage.type;
}

async function getStorageContent(repository, storageName) {
    return (
        (await getStorageType(repository, storageName)) &&
        repository.storagesMap.get(storageName).content
    );
}

async function createStorage(repository, storageType, isWriteable, storageName) {
    if (!isWriteable) {
        throw new Error(messages.readSideForbiddenOperation(storageType, 'create', storageName));
    }

    const existingStorageType = await getStorageType(repository, storageName);
    if (existingStorageType) {
        throw new Error(messages.storageRecreation(existingStorageType, storageName));
    }

    const storage = { type: storageType };
    repository.storagesMap.set(storageName, storage);

    switch (storageType) { // eslint-disable-line default-case
        case DICTIONARY_TYPE:
            storage.content = await repository.constructStorage(DICTIONARY_TYPE);
            break;
    }
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
    if (!existingStorageType) {
        throw new Error(messages.unexistingStorage(null, storageName));
    }

    const content = await getStorageContent(repository, storageName);
    repository.storagesMap.delete(storageName);

    switch (existingStorageType) { // eslint-disable-line default-case
        case DICTIONARY_TYPE:
            content.clear();
            break;
    }
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
    if (typeof repository.initHandler !== 'function') {
        repository.initHandler = async () => {};
    }

    repository.interfaceMap = new Map();
    repository.storagesMap = new Map();
    repository.internalError = null;

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
