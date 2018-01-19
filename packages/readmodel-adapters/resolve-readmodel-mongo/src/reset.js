import 'regenerator-runtime/runtime';

async function disposeDatabase(metaCollection, database) {
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
        disposeDatabase.bind(null, repository.metaCollection)
    );

    Object.keys(repository).forEach((key) => {
        delete repository[key];
    });

    repository.disposePromise = disposePromise;
    return disposePromise;
}
