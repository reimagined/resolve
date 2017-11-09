import { hash } from './utils';

export default function reset(repository, onDemandOptions) {
    const key = hash(onDemandOptions);

    if (repository.has(key)) {
        repository.get(key).collectionMap.forEach((collection) => {
            collection.resetIndexes();
            collection.remove({});
        });
        repository.get(key).onDestroy();
        repository.delete(key);
    }
}
