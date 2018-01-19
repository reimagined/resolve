import 'regenerator-runtime/runtime';
import { invokeMongo } from './utils';

async function disposeDatabase(metaCollection, collectionsPrefix, database) {
    const collectionDescriptors = await invokeMongo(metaCollection.find({}), 'toArray');

    for (const { key } of collectionDescriptors) {
        await invokeMongo(database, 'dropCollection', `${collectionsPrefix}${key}`);
    }

    await invokeMongo(metaCollection, 'drop');
    await invokeMongo(database, 'close');
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
