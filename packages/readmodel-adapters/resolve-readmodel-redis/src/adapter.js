import { exists, del } from './redisApi';
import { nativeCollection } from './collection';
import createMetaCollection from '../src/metaCollection';

async function createCollection(repository, name) {
    const { client, metaCollection } = repository;
    if (await exists(client, name)) {
        throw new Error(`Collection ${name} is exist`);
    }

    // if (await db.exists(getMetaCollectionName(name))) {
    //   throw new Error(`Meta collection ${name} is exist`)
    // }

    if (await collectionExists(repository, name)) {
        throw new Error(
            `Collection ${name} had already been created in current database, ` +
                'but not with resolve read model adapter and has no required meta information'
        );
    }

    await metaCollection.create(name);
    const collection = await nativeCollection(repository, name);
    await collection.ensureIndex({ fieldName: '_id', fieldType: 'number' });
}

async function dropCollection({ client, metaCollection }, name) {
    await del(client, name);
    await metaCollection.del(name);
}

async function collectionExists({ metaCollection }, name) {
    return await metaCollection.exists(name);
}

async function listCollections(repository) {
    return await repository.metaCollection.listCollections(repository);
}

const adapter = (repository) => {
    repository.metaCollection = createMetaCollection(repository);

    return Object.freeze({
        createCollection: createCollection.bind(null, repository),
        dropCollection: dropCollection.bind(null, repository),
        collection: nativeCollection.bind(null, repository),
        exists: collectionExists.bind(null, repository),
        listCollections: listCollections.bind(null, repository)
    });
};

export default adapter;
