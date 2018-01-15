import adapter from './adapter';
import metaCollection from './metaCollection';
import { writeCollectionInterface } from './collection';

async function initProjection(repository) {
    await repository.connectionPromise;
    if (repository.lastTimestamp !== 0) return;
    repository.lastTimestamp = 1;

    try {
        await repository.initHandler(repository.writeInterface);
    } catch (error) {
        repository.internalError = error;
    }
}

async function getReadOnlyCollectionInterface(repository, collectionName) {
    const { nativeAdapter } = repository;
    const collection = await nativeAdapter.collection(collectionName);
    const inf = {
        findOne: collection.findOne,
        find: collection.find,
        count: collection.count
    };

    const exceptWriteFunction = (funcName, collectionName) => {
        throw new Error(
            `The ${collectionName} collection’s ${funcName} method is not allowed on the read side`
        );
    };

    return Object.freeze(
        ['insert', 'update', 'remove', 'ensureIndex', 'removeIndex'].reduce((acc, funcName) => {
            acc[funcName] = exceptWriteFunction.bind(null, funcName, collectionName);
            return acc;
        }, inf)
    );
}

async function getCollectionInterface(repository, isWriteable, collectionName) {
    await repository.connectionPromise;
    const { nativeAdapter } = repository;
    if (!await nativeAdapter.exist(collectionName)) {
        if (!isWriteable) {
            throw new Error(`Collection ${collectionName} does not exist`);
        }
        await nativeAdapter.createCollection(collectionName);
    }

    if (isWriteable) {
        return writeCollectionInterface(repository, collectionName);
    }
    return getReadOnlyCollectionInterface(repository, collectionName);
}

async function listCollections(repository) {
    await repository.connectionPromise;
    return await repository.metaCollection.listCollections();
}

function getStoreInterface(repository, isWriteable) {
    return Object.freeze({
        collection: getCollectionInterface.bind(null, repository, isWriteable),
        listCollections: listCollections.bind(null, repository)
    });
}

async function synchronizeDatabase(repository, client) {
    repository.lastTimestamp = Math.max(
        repository.lastTimestamp,
        await repository.metaCollection.getMaxLastTimestamp()
    );
}

export default function init(repository) {
    if (repository.interfaceMap) {
        throw new Error('The read model storage is already initialized');
    }
    repository.lastTimestamp = 0;

    if (typeof repository.initHandler !== 'function') {
        repository.initHandler = async () => {};
    }

    repository.connectionPromise = repository
        .connectDatabase()
        .then(client => (repository.client = client))
        .then(synchronizeDatabase.bind(null, repository));

    repository.interfaceMap = new Map();
    repository.internalError = null;

    repository.nativeAdapter = adapter(repository);
    repository.metaCollection = metaCollection(repository);

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
