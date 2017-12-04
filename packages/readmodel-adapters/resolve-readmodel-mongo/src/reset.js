export default function reset(repository) {
    if (!repository.interfaceMap || !repository.connectionPromise) return;

    const collectionList = repository.collectionList;
    repository.connectionPromise.then(async (database) => {
        for (let collectionName of collectionList) {
            const collection = await database.collection(collectionName);
            await collection.drop();
        }

        await database.close();
    });

    Object.keys(repository).forEach((key) => {
        delete repository[key];
    });
}
