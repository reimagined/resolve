import 'regenerator-runtime/runtime';

async function disposeDatabase(collections) {
    for (let collection of collections) {
        await new Promise((resolve, reject) =>
            collection.remove({}, { multi: true }, err => (!err ? resolve() : reject(err)))
        );
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
