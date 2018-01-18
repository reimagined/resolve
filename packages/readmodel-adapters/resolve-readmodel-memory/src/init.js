import 'regenerator-runtime/runtime';

import messages from './messages';

const DICTIONARY_TYPE = 'Dictionary';

async function invokeNedb(resource, operationName, ...inputArgs) {
    return await new Promise((resolve, reject) =>
        resource[operationName](
            ...inputArgs,
            (err, ...outputArgs) => (!err ? resolve(...outputArgs) : reject(err))
        )
    );
}

function getStorageContent(repository, storageName) {
    const storage = repository.storagesMap.get(storageName);
    if (!storage || !storage.content || !storage.type) {
        return null;
    }
    return storage.content;
}

function getStorageType(repository, storageName) {
    const storage = repository.storagesMap.get(storageName);
    if (!storage || !storage.content || !storage.type) {
        return null;
    }
    return storage.type;
}

function raizeError(errorString) {
    throw new Error(errorString);
}

async function createStorage(repository, storageType, isWriteable, storageName) {
    if (!isWriteable) {
        raizeError(messages.readSideForbiddenOperation(storageType, 'create', storageName));
    }

    const existingStorageType = getStorageType(repository, storageName);
    if (existingStorageType) {
        raizeError(messages.storageRecreation(storageType, existingStorageType));
    }

    const collectionNedb = repository.createNedbCollection();
    repository.storagesMap.set(storageName, { content: collectionNedb, type: storageType });

    if (storageType === DICTIONARY_TYPE) {
        await invokeNedb(collectionNedb, 'ensureIndex', { fieldName: 'key' });
    }
}

function validateAndGetStorage(repository, storageType, storageName) {
    const existingStorageType = getStorageType(repository, storageName);
    if (!existingStorageType) {
        raizeError(messages.unexistingStorage(storageType, storageName));
    }

    if (existingStorageType !== storageType) {
        raizeError(messages.wrongStorageType(storageName, existingStorageType, storageType));
    }

    return getStorageContent(repository, storageName);
}

async function getDictionaryInterface(repository, isWriteable, dictionaryName) {
    const dictionaryIfaceKey = `${DICTIONARY_TYPE}_${dictionaryName}_${isWriteable}`;
    const interfaceMap = repository.interfaceMap;

    if (interfaceMap.has(dictionaryIfaceKey)) {
        return interfaceMap.get(dictionaryIfaceKey);
    }

    validateAndGetStorage(repository, DICTIONARY_TYPE, dictionaryName);

    const dictionaryIface = {
        exists: async (key) => {
            const storage = validateAndGetStorage(repository, DICTIONARY_TYPE, dictionaryName);
            const result = await invokeNedb(storage, 'findOne', { key });
            return result && result.hasOwnProperty('payload');
        },

        get: async (key) => {
            const storage = validateAndGetStorage(repository, DICTIONARY_TYPE, dictionaryName);
            const result = await invokeNedb(storage, 'findOne', { key });
            return result && result.hasOwnProperty('payload') ? result.payload : null;
        },

        set: async () =>
            raizeError(messages.readSideForbiddenOperation(DICTIONARY_TYPE, 'set', dictionaryName)),

        del: async () =>
            raizeError(messages.readSideForbiddenOperation(DICTIONARY_TYPE, 'del', dictionaryName))
    };

    if (isWriteable) {
        dictionaryIface.set = async (key, value) => {
            const storage = validateAndGetStorage(repository, DICTIONARY_TYPE, dictionaryName);
            await invokeNedb(storage, 'update', { key }, { key, value }, { upsert: true });
        };

        dictionaryIface.del = async (key) => {
            const storage = validateAndGetStorage(repository, DICTIONARY_TYPE, dictionaryName);
            await invokeNedb(storage, 'remove', { key });
        };
    }

    interfaceMap.set(dictionaryIfaceKey, Object.freeze(dictionaryIface));
    return interfaceMap.get(dictionaryIfaceKey);
}

async function listStorages(repository) {
    return Array.from(repository.storagesMap.keys()).map(storageName => ({
        name: storageName,
        type: getStorageType(repository, storageName)
    }));
}

async function existsStorage(repository, storageName) {
    return !!getStorageType(repository, storageName);
}

async function dropStorage(repository, isWriteable, storageName) {
    const existingStorageType = getStorageType(repository, storageName);

    if (!existingStorageType) {
        raizeError(messages.unexistingStorage(null, storageName));
    }

    if (!isWriteable) {
        raizeError(messages.readSideForbiddenOperation(existingStorageType, 'drop', storageName));
    }

    const collectionNedb = getStorageContent(repository, storageName);
    repository.storagesMap.delete(storageName);

    await invokeNedb(collectionNedb, 'resetIndexes');
    await invokeNedb(collectionNedb, 'remove', {}, { multi: true });
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
        raizeError(messages.reinitialization);
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
