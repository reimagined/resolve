import hash from './hash';

export default function reset(repository, onDemandOptions) {
    if (!onDemandOptions) {
        repository.forEach(({ collectionMap }) =>
            collectionMap.forEach((collection) => {
                collection.resetIndexes();
                collection.remove({});
            })
        );
        repository.clear();
        return;
    }

    const key = hash(onDemandOptions);
    if (repository.has(key)) {
        repository.get(key).collectionMap.forEach((collection) => {
            collection.resetIndexes();
            collection.remove({});
        });
        repository.delete(key);
    }
}
