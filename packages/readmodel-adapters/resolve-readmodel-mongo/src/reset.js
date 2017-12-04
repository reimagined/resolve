export default function reset(repository) {
    if (!repository.interfaceMap || !repository.connectionPromise) return;

    const collectionMap = repository.collectionMap;
    repository.connectionPromise.then(async (database) => {
        for (let [_, collection] of collectionMap) {
            await collection.drop();
        }

        await database.close();
    });

    Object.keys(repository).forEach((key) => {
        delete repository[key];
    });
}
