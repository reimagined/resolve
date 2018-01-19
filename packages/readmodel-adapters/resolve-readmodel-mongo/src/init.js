import 'regenerator-runtime/runtime';
import messages from './messages';
import { invokeMongo } from './utils';

async function getMongodbCollection(repository, database, name) {
    const fullName = `${repository.collectionsPrefix}${name}`;
    return await invokeMongo(database, 'collection', fullName);
}

async function upsertReplaceMongoDocument(collection, searchCondition, newDocument) {
    await invokeMongo(collection, 'remove', searchCondition);
    await invokeMongo(collection, 'update', searchCondition, newDocument, { upsert: true });
}

async function syncronizeDatabase(repository, database) {
    repository.metaCollection = await getMongodbCollection(
        repository,
        database,
        repository.metaCollectionName
    );

    const storageDescriptors = await invokeMongo(repository.metaCollection.find({}), 'toArray');

    for (const { key, lastTimestamp } of storageDescriptors) {
        repository.lastTimestamp = Math.max(repository.lastTimestamp, lastTimestamp);
        const mongoCollection = await getMongodbCollection(repository, database, key);
        repository.storagesMap.set(key, mongoCollection);
    }

    return database;
}

async function setStorageTimestamp(repository, key) {
    await upsertReplaceMongoDocument(
        repository.metaCollection,
        { key: `${repository.collectionsPrefix}${key}` },
        { lastTimestamp: repository.lastTimestamp }
    );
}

async function createMongoCollection(repository, key) {
    const database = await repository.connectionPromise;
    const mongoCollection = await getMongodbCollection(repository, database, key);
    repository.storagesMap.set(key, mongoCollection);

    await invokeMongo(mongoCollection, 'createIndex', { field: 1 }, { unique: true });

    await upsertReplaceMongoDocument(repository.metaCollection, { key }, { key }, { upsert: true });

    await setStorageTimestamp(repository, key);

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

            const entry = await invokeMongo(mongoCollection, 'findOne', { field });
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
                await invokeMongo(mongoCollection, 'remove', { field });
                return;
            }

            await upsertReplaceMongoDocument(
                mongoCollection,
                { field },
                { field, value },
                { upsert: true }
            );

            await setStorageTimestamp(repository, key);
        };

        storeIface.del = async (key) => {
            const mongoCollection = repository.storagesMap.get(key);
            if (!mongoCollection) {
                return;
            }

            await invokeMongo(mongoCollection, 'drop');
            await invokeMongo(repository.metaCollection, 'remove', { key: key });

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
