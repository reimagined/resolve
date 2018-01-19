import 'regenerator-runtime/runtime';
import { performMongoOperation } from './utils';

async function disposeDatabase(metaCollection, database) {
    const collectionDescriptors = await performMongoOperation(metaCollection.find({}), 'toArray');

    for (const { collectionName } of collectionDescriptors) {
        await performMongoOperation(database, 'dropCollection', collectionName);
    }

    await performMongoOperation(metaCollection, 'drop');
    await performMongoOperation(database, 'close');
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
