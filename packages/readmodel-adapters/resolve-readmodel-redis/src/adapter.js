import collection from './collection';
import { exists, del } from './redisApi';

export async function createCollection({ client, metaCollection }, name) {
    if (await exists(client, name)) {
        throw new Error(`Collection ${name} is exist`);
    }

    // if (await db.exists(getMetaCollectionName(name))) {
    //   throw new Error(`Meta collection ${name} is exist`)
    // }

    if (await metaCollection.exists(name)) {
        throw new Error(
            `Collection ${name} had already been created in current database, ` +
                'but not with resolve read model adapter and has no required meta information'
        );
    }

    metaCollection.create(name, {
        lastTimestamp: 0,
        indexes: []
    });
}

export async function dropCollection({ client, metaCollection }, name) {
    await del(client, name);
    await metaCollection.del(name);
}

export async function getCollection(repository, name) {
    return collection(repository, name);
}

const adapter = repository =>
    Object.freeze({
        createCollection: createCollection.bind(null, repository),
        dropCollection: dropCollection.bind(null, repository),
        collection: collection.bind(null, repository)
    });

export default adapter;
