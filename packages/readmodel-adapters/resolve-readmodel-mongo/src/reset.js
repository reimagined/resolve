import 'regenerator-runtime/runtime';
import { performMongoOperation } from './utils';

async function disposeDatabase(metaCollection, collectionsPrefix, database) {
    const collectionDescriptors = await performMongoOperation(metaCollection.find({}), 'toArray');

    for (const { key } of collectionDescriptors) {
        await performMongoOperation(database, 'dropCollection', `${collectionsPrefix}${key}`);
    }

    await performMongoOperation(metaCollection, 'drop');
    await performMongoOperation(database, 'close');
}

export default function reset(repository) {
    if (repository.disposePromise) {
        return repository.disposePromise;
    }

    const disposePromise = repository.connectionPromise.then(
        disposeDatabase.bind(null, repository.metaCollection, repository.collectionsPrefix)
    );

    Object.keys(repository).forEach((key) => {
        delete repository[key];
    });

    repository.disposePromise = disposePromise;
    return disposePromise;
}
