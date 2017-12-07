export default function reset(repository) {
    if (!repository.interfaceMap || !repository.connectionPromise) return;

    repository.connectionPromise.then(async (database) => {
        const metaCollection = await database.collection(repository.metaCollectionName);
        const collectionDescriptors = await metaCollection.find({}).toArray();

        for (const { collectionName } of collectionDescriptors) {
            await database.dropCollection(collectionName);
        }

        await metaCollection.drop();
        await database.close();
    });

    Object.keys(repository).forEach((key) => {
        delete repository[key];
    });
}
