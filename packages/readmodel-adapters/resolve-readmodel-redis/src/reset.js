import 'regenerator-runtime/runtime';

import { del } from './redisApi';
import redisAdapter from './adapter';

async function disposeDatabase(
    { metaCollectionName, autoincMetaCollectionName, lastTimestampCollectionName },
    client
) {
    const tempRepository = {
        metaCollectionName,
        autoincMetaCollectionName,
        lastTimestampCollectionName,
        client
    };

    const adapter = redisAdapter(tempRepository);

    const collectionNames = adapter.listCollections();
    const promises = collectionNames.map(async (collectionName) => {
        await adapter.dropCollection(collectionName);
    });
    await Promise.all(promises);
    await Promise.all([
        await del(client, metaCollectionName),
        await del(client, autoincMetaCollectionName),
        await del(client, lastTimestampCollectionName)
    ]);
}

export default function reset(repository) {
    if (repository.disposePromise) {
        return repository.disposePromise;
    }

    const {
        metaCollectionName,
        autoincMetaCollectionName,
        lastTimestampCollectionName
    } = repository;

    const disposePromise = repository.connectionPromise.then(
        disposeDatabase.bind(null, {
            metaCollectionName,
            autoincMetaCollectionName,
            lastTimestampCollectionName
        })
    );

    Object.keys(repository).forEach((key) => {
        delete repository[key];
    });

    repository.disposePromise = disposePromise;
    return disposePromise;
}
