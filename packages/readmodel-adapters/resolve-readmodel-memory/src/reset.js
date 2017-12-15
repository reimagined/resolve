import 'regenerator-runtime/runtime';

async function disposeDatabase(collections) {
    for (let collection of collections) {
        await collection.resetIndexes();
        await collection.remove({}, { multi: true });
    }
}

export default function reset(repository) {
    if (repository.disposePromise) {
        return repository.disposePromise;
    }

    const disposePromise = disposeDatabase(repository.collectionMap.values());

    Object.keys(repository).forEach((key) => {
        delete repository[key];
    });

    repository.disposePromise = disposePromise;
    return disposePromise;
}
