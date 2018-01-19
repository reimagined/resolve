import 'regenerator-runtime/runtime';

export default function reset(repository) {
    if (repository.disposePromise) {
        return repository.disposePromise;
    }

    for (let key of repository.storagesMap.keys()) {
        repository.storagesMap.get(key).clear();
    }

    Object.keys(repository).forEach((key) => {
        delete repository[key];
    });

    repository.disposePromise = Promise.resolve();
    return repository.disposePromise;
}
