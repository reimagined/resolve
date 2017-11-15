export default function reset(repository) {
    if (repository.interfaceMap) return;

    repository.collectionMap.forEach((collection) => {
        collection.resetIndexes();
        collection.remove({});
    });

    Object.keys(repository).forEach((key) => {
        delete repository[key];
    });
}
