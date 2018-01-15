import { exists, del } from './redisApi';
import { nativeCollection } from './collection';

export async function createCollection(repository, name) {
    const { client, metaCollection } = repository;
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

    await metaCollection.create(name);
    const collection = await nativeCollection(repository, name);
    await collection.ensureIndex({ fieldName: '_id', fieldType: 'number' });
}

export async function dropCollection({ client, metaCollection }, name) {
    await del(client, name);
    await metaCollection.del(name);
}

export async function exist({ metaCollection }, name) {
    return await metaCollection.exists(name);
}

const adapter = repository =>
    Object.freeze({
        createCollection: createCollection.bind(null, repository),
        dropCollection: dropCollection.bind(null, repository),
        collection: nativeCollection.bind(null, repository),
        exist: exist.bind(null, repository)
    });

export default adapter;
