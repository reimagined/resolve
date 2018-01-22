import 'regenerator-runtime/runtime';
import messages from './messages';

async function getMongodbCollection(repository, database, name) {
    const fullName = `${repository.collectionsPrefix}${name}`;
    return await database.collection(fullName);
}

async function setRepositoryTimestamp(repository, key) {
    await repository.metaCollection.update(
        { type: 'LastTimestamp' },
        { type: 'LastTimestamp', value: repository.lastTimestamp },
        { upsert: true }
    );
}

async function syncronizeDatabase(repository, database) {
    repository.metaCollection = await getMongodbCollection(
        repository,
        database,
        repository.metaCollectionName
    );

    const storageDescriptors = await repository.metaCollection
        .find({ type: 'StorageDescriptor' })
        .toArray();

    const lastTimestampDescriptor = await repository.metaCollection.findOne({
        type: 'LastTimestamp'
    });

    for (const { key } of storageDescriptors) {
        const mongoCollection = await getMongodbCollection(repository, database, key);
        repository.storagesMap.set(key, mongoCollection);
    }

    if (lastTimestampDescriptor == null) {
        repository.lastTimestamp = 0;
        await setRepositoryTimestamp(repository);
    } else {
        repository.lastTimestamp = lastTimestampDescriptor.value;
    }

    return database;
}

async function createMongoCollection(repository, key) {
    const database = await repository.connectionPromise;
    const mongoCollection = await getMongodbCollection(repository, database, key);
    repository.storagesMap.set(key, mongoCollection);

    await mongoCollection.createIndex({ field: 1 }, { unique: true });
    await repository.metaCollection.insert({ type: 'StorageDescriptor', key });
    await setRepositoryTimestamp(repository);

    return mongoCollection;
}

function getStoreInterface(repository, isWriteable) {
    const storeIface = {
        hget: async (key, field) => {
            let mongoCollection = repository.storagesMap.get(key);

            if (!repository.storagesMap.has(key)) {
                if (!isWriteable) {
                    throw new Error(messages.unexistingStorage(key));
                }
                mongoCollection = await createMongoCollection(repository, key);
            }

            const entry = await mongoCollection.findOne({ field });
            return entry ? entry.value : null;
        },

        hset: async (key) => {
            throw new Error(messages.readSideForbiddenOperation('hset', key));
        },

        del: async (key) => {
            throw new Error(messages.readSideForbiddenOperation('del', key));
        }
    };

    if (isWriteable) {
        storeIface.hset = async (key, field, value) => {
            const mongoCollection = repository.storagesMap.has(key)
                ? repository.storagesMap.get(key)
                : await createMongoCollection(repository, key);

            if (value === null || value === undefined) {
                await mongoCollection.remove({ field });
                return;
            }

            await mongoCollection.update({ field }, { field, value }, { upsert: true });

            await setRepositoryTimestamp(repository);
        };

        storeIface.del = async (key) => {
            const mongoCollection = repository.storagesMap.get(key);
            if (!mongoCollection) {
                return;
            }

            await mongoCollection.drop();
            await repository.metaCollection.remove({ type: 'StorageDescriptor', key });
            await setRepositoryTimestamp(repository);

            repository.storagesMap.delete(key);
        };
    }

    return Object.freeze(storeIface);
}

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

export default function init(repository) {
    if (repository.storagesMap) {
        throw new Error(messages.reinitialization);
    }
    repository.lastTimestamp = 0;

    if (typeof repository.initHandler !== 'function') {
        repository.initHandler = async () => {};
    }

    repository.connectionPromise = repository
        .connectDatabase()
        .then(syncronizeDatabase.bind(null, repository));

    repository.storagesMap = new Map();
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
