import 'regenerator-runtime/runtime';

async function disposeDatabase(metaCollectionName, database) {
    const metaCollection = await database.collection(metaCollectionName);
    const collectionDescriptors = await metaCollection.find({}).toArray();

    for (const { collectionName } of collectionDescriptors) {
        await database.dropCollection(collectionName);
    }

    await metaCollection.drop();
    await database.close();
}

export default function reset(repository) {
    if (repository.disposePromise) {
        return repository.disposePromise;
    }

    const disposePromise = repository.connectionPromise.then(
        disposeDatabase.bind(null, repository.metaCollectionName)
    );

    Object.keys(repository).forEach((key) => {
        delete repository[key];
    });

    repository.disposePromise = disposePromise;
    return disposePromise;
}
